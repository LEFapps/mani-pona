import assert from 'assert'
import { isObject } from 'lodash'
import { challenge } from '../core/tools'
import StateMachine from '../core/statemachine'

const log = require('util').debuglog('Transactions')

/**
 * Transactions are the way a user sees the ledger.
 */
const TransactionsDynamo = (table, ledger, verification) => {
  assert(isObject(verification), 'Verification')
  // to reduce the size of the results, we limit the attributes requested (omitting the signatures)
  const short = table.attributes(['ledger', 'destination', 'amount', 'balance', 'date', 'payload', 'next', 'sequence', 'uid', 'income', 'demurrage', 'challenge'])
  return {
    table, // we allow access to the underlying table
    async current () {
      return short.getItem({ ledger, entry: '/current' })
    },
    async currentFull () {
      return table.getItem({ ledger, entry: '/current' })
    },
    async pending () {
      return short.getItem({ ledger, entry: 'pending' })
    },
    async recent () {
      return table.queryItems({
        KeyConditionExpression: 'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledger': ledger,
          ':slash': '/'
        }
      })
    },
    async challenge (destination, amount) {
      return StateMachine(table)
        .getSources({ ledger, destination })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async create (proof) {
      const existing = await table.getItem({ ledger, entry: 'pending' })
      if (existing && existing.challenge === proof.payload) {
        console.log(`Transaction ${proof.payload} was already created`)
        return existing.next // idempotency
      }
      let next
      const transaction = table.transaction()
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .getPayloadSources()
        .then(t => t.continuePayload())
        .then(t => t.addSignatures({ ledger, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next
          return t
        })
        .then(t => t.save())
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      await transaction.execute()
      return next
    },
    async confirm (proof) {
      // proof contains signature, counterSignature, payload
      const existing = await table.getItem({ ledger, entry: '/current' })
      if (existing && existing.challenge === proof.payload) {
        console.log(`Transaction ${proof.payload} was already confirmed`)
        return existing.next // idempotency
      }
      let next
      const transaction = table.transaction()
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .continuePending()
        .then(t => t.addSignatures({ ledger, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next
          return t
        })
        .then(t => t.save())
      await transaction.execute()
      log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return next
    },
    // deprecated
    async saveEntry (entry) {
      assert(entry.ledger === ledger, 'Matching ledger')
      await verification.verifyEntry(entry)
      return table.putItem(entry)
    },
    // deprecated
    async saveTwin (twin) {
      assert(twin.ledger.ledger === ledger, 'Matching source ledger')
      assert(twin.destination.ledger === ledger, 'Matching destination ledger')
      const transaction = table.transaction()
      twin.forEach((entry) => {
        verification.verifyEntry(entry)
        transaction.putItem(entry)
      })
      return transaction.execute()
    },
    // deprecated
    // return a "transactional version" of transactions
    transactional (transaction = table.transaction()) {
      return {
        ...TransactionsDynamo(transaction, ledger, verification),
        transaction,
        async execute () { return transaction.execute() }
      }
    }
  }
}

export default TransactionsDynamo
