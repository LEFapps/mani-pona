import assert from 'assert'
import { isString } from 'lodash'
/**
 * Strictly dynamodb related system calls. Look in src/core/system.js for heavy lifting.
 */
// TODO: DEPRECATED
const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }

const system = function (table) {
  return {
    async parameters (required = false) {
      const errorMsg = required ? 'Missing system parameters' : undefined
      return table.getItem(PARAMS_KEY, errorMsg)
    },
    async keys (required = false) {
      const errorMsg = required ? 'Missing system keys' : undefined
      return table.getItem(PK_KEY, errorMsg)
    },
    async saveParameters (parameters) {
      return table.putItem({
        ...PARAMS_KEY,
        ...parameters
      })
    },
    async register (registration) {
      await table.putItem({
        ...registration,
        entry: 'pk'
      })
      return registration.ledger
    },
    // return a "transactional version" of system
    transactional (transaction = table.transaction()) {
      return {
        ...system(transaction),
        transaction,
        async execute () { return transaction.execute() }
      }
    }
  }
}

export default system
