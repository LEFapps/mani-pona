import assert from 'assert'
import { getLogger } from 'server-log'
import { KeyWrapper } from '../../client/shared/crypto'
import { redeem, DEFAULT_BALANCE } from '../../client/shared/tools'
import { getAccountTypesMap } from '../cognito/util'
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
  'remainder',
  'challenge',
  'message',
  'notify'
]
/**
 * Specialized functions to strictly work with ledgers. Continues building on table.
 */

function ledgers (table, prefix = '') {
  const skip = prefix.length
  /**
   * Get a specific entry in this ledger.
   */
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
  async function notifications (ledger) {
    const item = table
      .attributes(['value'])
      .getItem({ ledger, entry: 'notification' })
    table.deleteItem({ ledger, entry: 'notification' })
    return item
  }
  async function getParameters (fingerprint) {
    let accountType = 'default'
    const settings = await table
      .attributes(['ledger', 'accountType'])
      .getItem({ ledger: fingerprint, entry: 'pk' })
    if (settings && settings.accountType) {
      accountType = settings.accountType
    } else {
      log.warn('Ledger %s doesnt exist yet or has no account type, falling back to default', fingerprint)
    }
    const parameters = getAccountTypesMap()[accountType]
    if (!parameters) throw new Error(`No parameters found for type ${accountType}`)
    return parameters
  }
  async function available (fingerprint, now = new Date()) {
    log.debug('Checking available balance on %s', fingerprint)
    const parameters = await getParameters(fingerprint)
    const current = await entry(fingerprint, '/current')
    if (current) {
      log.debug('Ledger has parameters\n%j\nand current transaction\n%j', parameters, current)
      return redeem(current, parameters, { now })
    } else {
      log.debug('Ledger %s has no current transaction (in the process of being created?), returning default balance', fingerprint)
      return DEFAULT_BALANCE
    }
  }
  return {
    entry,
    notifications,
    getParameters,
    available,
    async current (fingerprint, required = false) {
      return entry(fingerprint, '/current', required)
    },
    async pending (fingerprint, required = false) {
      return entry(fingerprint, 'pending', required)
    },
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
    async addAccountType (fingerprint, accountType) {
      const keys = await table.getItem(
        { ledger: fingerprint, entry: 'pk' },
        `Key(s) not found for ledger ${fingerprint}`)
      keys.accountType = accountType
      return table.putItem(keys)
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
    /**
    * Check if the amount is available on this ledger, using a projected balance (on the specified datetime).
    * Returns true or false.
    */
    async checkAvailable (fingerprint, amount, date) {
      if (amount.value > 0) return true
      log.debug('Checking availability of %s on ledger %s on date %s', amount, fingerprint, date)
      const result = await available(fingerprint, date)
      log.debug('Virtual balance of ledger %s:\n%j', fingerprint, result)
      return result.balance.add(amount).value > 0 // would the supplied amount keep the (virtual) balance below zero?
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
