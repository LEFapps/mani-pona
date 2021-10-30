import assert from 'assert'
import { getLogger } from 'server-log'
import { KeyWrapper } from '../../client/shared/crypto'
const log = getLogger('dynamodb:ledgers')

const SHORT_ATTRIBUTES = [
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
  'challenge',
  'message'
]
/**
 * Specialized functions to strictly work with ledgers. Continues building on table.
 */

function ledgers (table, prefix = '') {
  const skip = prefix.length
  async function entry (fingerprint, entry, required = false) {
    const item = await table.getItem(
      { ledger: prefix + fingerprint, entry },
      required
        ? `Entry ${entry} not found for ledger ${fingerprint}`
        : undefined
    )
    if (item) {
      item.ledger = item.ledger.substring(skip) // strip the prefix
    }
    return item
  }
  return {
    async current (fingerprint, required = false) {
      return entry(fingerprint, '/current', required)
    },
    async pending (fingerprint, required = false) {
      return entry(fingerprint, 'pending', required)
    },
    entry,
    async putEntry (entry) {
      assert(entry instanceof Object)
      entry.ledger = prefix + entry.ledger
      return table.putItem(entry)
    },
    async deletePending (fingerprint) {
      return table.deleteItem({
        ledger: prefix + fingerprint,
        entry: 'pending'
      })
    },
    async keys (fingerprint, required = false) {
      const keys = await table.getItem(
        { ledger: fingerprint, entry: 'pk' },
        required ? `Key(s) not found for ledger ${fingerprint}` : undefined
      )
      return keys ? KeyWrapper(keys) : undefined
    },
    async publicKey (fingerprint) {
      return table
        .attributes(['ledger', 'publicKeyArmored', 'alias'])
        .getItem({ ledger: fingerprint, entry: 'pk' })
    },
    async putKey (key) {
      key.entry = 'pk'
      return table.putItem(key)
    },
    async recent (fingerprint) {
      log.debug('ledger = %s AND begins_with(entry,/)', fingerprint)
      return table.queryItems({
        KeyConditionExpression:
          'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledger': fingerprint,
          ':slash': '/'
        }
      })
    },
    shortAttributes () {
      return SHORT_ATTRIBUTES
    },
    async exportLedger (fingerprint) {
      return table.attributes(SHORT_ATTRIBUTES).queryAll({
        KeyConditionExpression:
          'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledger': fingerprint,
          ':slash': '/'
        }
      })
    },
    async exportAll () {
      return table.attributes(SHORT_ATTRIBUTES).scanAll({
        FilterExpression: 'begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':slash': '/'
        }
      })
    },
    short () {
      // to reduce the size of the results, we can limit the attributes requested (omitting the signatures, which are fairly large text fields).
      return ledgers(table.attributes(SHORT_ATTRIBUTES), prefix)
    },
    transaction () {
      return ledgers(table.transaction(), prefix)
    },
    items () {
      return table.items()
    },
    async execute () {
      return table.execute()
    }
  }
}

export default ledgers
