import assert from 'assert'
import { isString } from 'lodash'
import tools from '../core/tools'
/**
 * Strictly dynamodb related system calls. Look in src/core/system.js for heavy lifting.
 */

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
        ...tools.toDb(parameters)
      })
    },
    async saveKeys ({ publicKeyArmored, privateKeyArmored }) {
      assert(isString(publicKeyArmored), 'Public key')
      assert(isString(privateKeyArmored), 'Private key')
      return table.putItem({
        ...PK_KEY,
        publicKeyArmored,
        privateKeyArmored
      })
    }
  }
}

export default system
