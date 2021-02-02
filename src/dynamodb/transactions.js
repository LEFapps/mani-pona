import assert from 'assert'
import { isObject } from 'lodash'
import { challenge } from '../core/tools'

/**
 * Transactions are the way a user sees the ledger.
 */
const transactions = (table, ledger, verification) => {
  assert(isObject(verification), 'Verification')
  // to reduce the size of the results, we limit the attributes requested:
  const short = table.attributes(['ledger', 'destination', 'amount', 'balance', 'date'])
  const chain = table.attributes(['ledger', 'sequence', 'next', 'uid'])
  return {
    table, // we allow access to the underlying table
    async current () {
      return short.getItem({ ledger, entry: '/current' })
    },
    async currentChain () {
      return chain.getItem({ ledger, entry: '/current' })
    },
    async pending () {
      return short.getItem({ ledger, entry: 'pending' })
    },
    async challenge (targetLedger, amount) {
      const date = new Date(Date.now())
      const current = chain.getItem({ ledger, entry: '/current' })
      const target = chain.getItem({ targetLedger, entry: '/current' })
      return challenge(date, current, target, amount)
    },
    async recent () {
      return short.queryItems({
        KeyConditionExpression: 'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledge': ledger,
          ':slash': '/'
        }
      })
    },
    async verifier () {
      return verification(table).getVerifier(ledger)
    },
    async saveEntry (entry) {
      assert(entry.ledger === ledger, 'Matching ledger')
      verification.verifyEntry(entry)
      return table.putItem(entry)
    },
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
    // return a "transactional version" of transactions
    transactional (transaction = table.transaction()) {
      return {
        ...transactions(transaction, ledger, verification),
        transaction,
        async execute () { return transaction.execute() }
      }
    }
  }
}

export default transactions
