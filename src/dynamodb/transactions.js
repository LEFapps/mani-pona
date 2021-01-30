import assert from 'assert'
import tools from '../core/tools'

/**
 * Transactions are the way a user sees the ledger.
 * For creation tasks, etc, see 'entries'.
 */
const transactions = (table, ledger) => {
  // to reduce the size of the results, we limit the attributes requested:
  const short = table.attributes(['ledger', 'destination', 'amount', 'balance', 'date'])
  return {
    async current () {
      return short.getItem({ ledger, entry: '/current' })
    },
    async pending () {
      return short.getItem({ ledger, entry: 'pending' })
    },
    async recent () {
      return short.query({
        KeyConditionExpression: 'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledge': ledger,
          ':slash': '/'
        }
      })
    },
    async saveEntry (entry) {
      assert(entry.ledger === ledger, 'Matching ledger')
      return table.putItem(tools.toDb(entry))
    }
  }
}

export default transactions
