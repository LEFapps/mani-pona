import util from 'util'
import { getSources, getPayloads, getNextTargets, addAmount, addDI, getPayloadTargets, getPendingTargets, addSignatures, addSystemSignatures, saveResults } from './transactions'
import { KeyGenerator } from '../crypto'
import { mani } from '../mani'

const logutil = util.debuglog('StateMachine') // activate by adding NODE_DEBUG=StateMachine to environment

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

const PK_KEY = { ledger: 'system', entry: 'pk' }
const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }

function TheMachine (table) {
  const msgs = []
  const log = (msg) => {
    logutil(msg)
    msgs.push(msg)
  }
  return {
    async systemInit () {
      try {
        log('System init')
        let keys = await table.getItem(PK_KEY)
        if (keys) {
          log('System already initialized')
          return // idempotency
        }
        const trans = table.transaction()
        keys = await KeyGenerator().generate()
        log('Keys generated')
        const { publicKeyArmored, privateKeyArmored } = keys
        trans.putItem({
          ...PK_KEY,
          publicKeyArmored,
          privateKeyArmored
        })
        trans.putItem({
          ...PARAMS_KEY,
          income: mani(100),
          demurrage: 5.0
        })
        log('Keys and parameters stored')
        // console.log(JSON.stringify(trans.items(), null, 2))
        const context = {
          sources: await getSources(trans, { ledger: 'system', destination: 'system' })
        }
        context.targets = await getNextTargets(trans, context)
        context.targets = await addAmount(context, mani(0))
        context.targets = await addSystemSignatures(trans, context, keys)
        saveResults(trans, context)
        await trans.execute()
        log(`Database update:\n${JSON.stringify(trans.items(), null, 2)}`)
      } catch (err) {
        logutil(err.stack)
        throw err
      }
      return msgs.join(', ')
    }
  }
}

export default TheMachine
