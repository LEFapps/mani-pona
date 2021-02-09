import util from 'util'
import loglevel from 'loglevel'
import { getSources, getPayloads, getNextTargets, addAmount, addDI, getPayloadTargets, getPendingTargets, addSignatures, addSystemSignatures, saveResults } from './transactions'
import { Transaction } from './transaction'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, continuation, addSignature, challenge, sortKey, toEntry } from './tools'
import { mani } from '../mani'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }
const logutil = util.debuglog('ManiCore') // activate by adding NODE_DEBUG=StateMachine to environment

const SystemCore = (systemDynamo, SystemTransactions, userpool) => {
  const table = SystemTransactions.table
  const msgs = []
  const log = (msg) => {
    logutil(msg)
    msgs.push(msg)
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
      const context = {
        sources: await getSources(trans, { ledger: 'system', destination: 'system' })
      }
      context.targets = await getNextTargets(trans, context)
      context.targets = addAmount(context, mani(0))
      context.targets = await addSystemSignatures(trans, context, keys)
      saveResults(trans, context)
      await trans.execute()
      log(`Database update:\n${JSON.stringify(trans.items(), null, 2)}`)
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      const context = {
        sources: await getSources(table, { ledger: '<fingerprint>', destination: 'system' })
      }
      context.targets = await getNextTargets(table, context)
      context.targets = await addAmount(context, mani(0))
      return context.targets.ledger.challenge
    },
    async register (registration) {
      const { publicKeyArmored, payload, alias } = registration
      const ledger = await Verifier(publicKeyArmored).fingerprint()
      const existing = await table.getItem({ ledger, entry: '/current' })
      if (existing) return ledger
      const context = {
        payloads: getPayloads(payload),
        sources: await getSources(table, { ledger, destination: 'system' })
      }
      context.targets = getPayloadTargets(context)
      context.targets = addAmount(context, mani(0))
      context.targets = await addSystemSignatures(table, context)
      context.targets = await addSignatures(table, context, { ledger, ...registration })
      // log('Registration context:\n' + JSON.stringify(context, null, 2))
      const transaction = table.transaction()
      transaction.putItem({ ledger, entry: 'pk', publicKeyArmored, alias, challenge: payload })
      saveResults(transaction, context)
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
      users.forEach((user) => {
        // const curentUser = await SystemTransactions.getItem({ledger: user.ledger, entry: '/current'})
        results.ledgers++
      })
      console.log(results)
      return results
    }
  }
}

export default SystemCore
