import assert from 'assert'
import { isObject } from 'lodash'
import StateMachine from '../core/statemachine'
import { getLogger } from 'server-log'
const log = getLogger('dynamodb:index')

/**
 * Transactions are the way a user sees a ledger.
 *
 * Arguments:
 * - table: singular DynamoDB table
 * - ledger: fingerprint of public key, essentially an 'account number'
 * - verification:
 */
const TransactionsDynamo = (table, ledger, verification) => {
  assert(isObject(verification), 'Verification')
  log.trace('Transactions dynamo')
  // to reduce the size of the results, we can limit the attributes requested (omitting the signatures, which are fairly large text fields).
  const short = table.attributes([
    'ledger',
    'destination',
    'amount',
    'balance',
    'date',
    'payload',
    'next',
    'sequence',
    'uid',
    'income',
    'demurrage',
    'challenge'
  ])
  return {
    table, // we allow access to the underlying table
    async current () {
      return short.getItem({ ledger, entry: '/current' })
    },
    async currentFull () {
      return table.getItem({ ledger, entry: '/current' })
    },
    async pending () {
      return table.getItem({ ledger, entry: 'pending' })
    },
    async recent () {
      log.debug('ledger = %s AND begins_with(entry,/)', ledger)
      return table.queryItems({
        KeyConditionExpression:
          'ledger = :ledger AND begins_with(entry, :slash)',
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
        log.info(`Transaction ${proof.payload} was already created`)
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
        log.info(`Transaction ${proof.payload} was already confirmed`)
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
      log.debug(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return next
    },
    async cancel (challenge) {
      const pending = await table.getItem({ ledger, entry: 'pending' })
      if (pending && pending.challenge === challenge) {
        if (pending.destination === 'system') {
          throw new Error('System transactions cannot be cancelled.')
        }
        const destination = await table.getItem({
          ledger: pending.destination,
          entry: 'pending'
        })
        if (!destination) {
          throw new Error(
            'No matching transaction found on destination ledger, please contact system administrators.'
          )
        }
        const transaction = table.transaction()
        transaction.deleteItem({ ledger, entry: 'pending' })
        transaction.deleteItem({
          ledger: pending.destination,
          entry: 'pending'
        })
        await transaction.execute()
        return 'Pending transaction successfully cancelled.'
      } else {
        return 'No matching pending transaction found, it may have already been cancelled or confirmed.'
      }
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
      twin.forEach(entry => {
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
        async execute () {
          return transaction.execute()
        }
      }
    }
  }
}

export default TransactionsDynamo
