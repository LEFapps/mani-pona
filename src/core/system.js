import util from 'util'
import loglevel from 'loglevel'
import StateMachine from './statemachine'
import { getSources, getPayloads, getNextTargets, addAmount, addDI, getPayloadTargets, getPendingTargets, addSignatures, addSystemSignatures, saveResults } from './transactions'
import { Transaction } from './transaction'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, continuation, addSignature, challenge, sortKey, toEntry } from './tools'
import { mani } from '../mani'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }
const logutil = util.debuglog('SystemCore') // activate by adding NODE_DEBUG=SystemCore to environment

const SystemCore = (table, userpool) => {
  const log = (msg) => {
    logutil(msg)
  }
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY, 'Missing system parameters')
    },
    async init () {
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
      trans.putItem({ ...PK_KEY, publicKeyArmored, privateKeyArmored })
      trans.putItem({ ...PARAMS_KEY, income: mani(100), demurrage: 5.0 })
      log('Keys and parameters stored')
      await StateMachine(trans)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save()).catch(err => log(err, err.stack))
      log(`Database update:\n${JSON.stringify(trans.items(), null, 2)}`)
      await trans.execute()
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
      transaction.putItem({ ledger, entry: 'pk', publicKeyArmored, alias, challenge: payload })
      await transaction.execute()
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return ledger
    },
    async jubilee () {
      const users = await userpool.getUsers()
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      const parameters = await table.getItem(PARAMS_KEY, 'Missing system parameters')
      const transaction = table.transaction()
      for (let { ledger } of users) { // these for loops allow await!
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
      }
      await transaction.execute()
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return results
    }
  }
}

export default SystemCore
