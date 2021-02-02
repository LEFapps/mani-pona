import assert from 'assert'
import { isObject } from 'lodash'
import { challenge } from '../core/tools'

/**
 * Transactions are the way a user sees the ledger.
 */
const transactions = (table, ledger, verification) => {
  assert(isObject(verification), 'Verification')
  // to reduce the size of the results, we limit the attributes requested (omitting the signatures)
  const short = table.attributes(['ledger', 'destination', 'amount', 'balance', 'date', 'payload', 'next', 'sequence', 'uid'])
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
    async challenge (targetLedger, amount) {
      const date = new Date(Date.now())
      const current = short.getItem({ ledger, entry: '/current' })
      const target = short.getItem({ targetLedger, entry: '/current' })
      return challenge(date, current, target, amount)
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
    async saveEntry (entry) {
      assert(entry.ledger === ledger, 'Matching ledger')
      await verification.verifyEntry(entry)
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
