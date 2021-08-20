import { getLogger } from 'server-log'

const log = getLogger('core:ledgers')
/**
 * A view on transaction ledgers that allows for a specfic prefix to be used.
 *
 * For use within core.
 */

const ledgerTable = (table, prefix = '') => {
  const skip = prefix.length
  async function get (l, entry, errorMsg) {
    const item = await table.getItem({ ledger: prefix + l, entry: '/current' }, errorMsg)
    if (!item) return
    item.ledger = item.ledger.substring(skip)
    return item
  }
  return {
    async current (l, errorMsg) {
      return get(l, '/current', errorMsg)
    },
    async pending (l, errorMsg) {
      return get(l, 'pending', errorMsg)
    },
    async entry (l, entry, errorMsg) {
      return get(l, entry, errorMsg)
    },
    async putEntry (entry) {
      entry.ledger = prefix + entry.ledger
      return table.putItem(entry)
    },
    async deleteEntry (entry) {
      entry.ledger = prefix + entry.ledger
      return table.deleteItem(entry)
    },
    async pk (ledger, errorMsg) {
      // note: we share PK for the different ledgers
      return table.getItem({ ledger, entry: 'pk' }, errorMsg)
    },
    async getItem (parameters) {
      throw new Error('Replace this code')
    }
  }
}

export default ledgerTable
