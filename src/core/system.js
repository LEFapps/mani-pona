import util from 'util'
import StateMachine from './statemachine'
import { KeyGenerator, Verifier } from '../../client/shared/crypto'
import { mani } from '../mani'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }
const logutil = util.debuglog('SystemCore') // activate by adding NODE_DEBUG=SystemCore to environment

const SystemCore = (table, userpool) => {
  const log = msg => {
    logutil(msg)
  }
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY)
    },
    async init () {
      log('System init')
      let keys = await table.getItem(PK_KEY)
      if (keys) {
        log('System already initialized')
        return // idempotency
      }
      // initializing fresh system:
      const trans = table.transaction()
      keys = await KeyGenerator().generate()
      log('System keys generated')
      const { publicKeyArmored, privateKeyArmored } = keys
      trans.putItem({ ...PK_KEY, publicKeyArmored, privateKeyArmored })
      trans.putItem({ ...PARAMS_KEY, income: mani(100), demurrage: 5.0 }) // TODO: replace hardcoded values
      await StateMachine(trans)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save())
        .catch(err => log(err, err.stack))
      log(`Database update:\n${JSON.stringify(trans.items(), null, 2)}`)
      log('System keys and parameters stored')
      await trans.execute()
      return `SuMsy initialized with ${mani(
        100
      ).format()} income and 5% demurrage.`
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      return StateMachine(table)
        .getSources({ ledger: '<fingerprint>', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async register (registration) {
      const { publicKeyArmored, payload, alias } = registration
      const ledger = await Verifier(publicKeyArmored).fingerprint()
      const existing = await table.getItem({ ledger, entry: '/current' })
      if (existing) return ledger
      const transaction = table.transaction()
      // TODO: assert amount = 0
      await StateMachine(transaction)
        .getPayloads(payload)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.continuePayload())
        .then(t => t.addSystemSignatures())
        .then(t => t.addSignatures({ ledger, ...registration }))
        .then(t => t.save())
      // log('Registration context:\n' + JSON.stringify(context, null, 2))
      transaction.putItem({
        ledger,
        entry: 'pk',
        publicKeyArmored,
        alias,
        challenge: payload
      })
      await transaction.execute()
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return ledger
    },
    async jubilee (ledger) {
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      const parameters = await table.getItem(
        PARAMS_KEY,
        'Missing system parameters'
      )
      async function applyJubilee (ledger) {
        const transaction = table.transaction()
        log(`Applying DI to ${ledger}`)
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addDI(parameters))
          .then(t => {
            const entry = t.getPrimaryEntry()
            results.income = results.income.add(entry.income)
            results.demurrage = results.demurrage.add(entry.demurrage)
            results.ledgers++
            return t
          })
          .then(t => t.addSystemSignatures())
          .then(t => t.save())
        await transaction.execute()
      }
      if (ledger) {
        await applyJubilee(ledger)
      } else {
        const users = await userpool.listJubileeUsers()
        for (let { ledger } of users) {
          // these for loops allow await!
          await applyJubilee(ledger)
        }
      }
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return results
    }
  }
}

export default SystemCore
