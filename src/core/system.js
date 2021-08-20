import StateMachine from './statemachine'
import ledgerTable from './ledgerTable'
import { KeyGenerator, Verifier, mani } from '../shared'
import { getLogger } from 'server-log'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }

const log = getLogger('core:system')

const SystemCore = (table, userpool) => {
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY)
    },
    async init () {
      log.info('System init')
      let keys = await table.getItem(PK_KEY)
      if (keys) {
        log.info('System already initialized')
        return // idempotency
      }
      // initializing fresh system:
      const trans = table.transaction()
      keys = await KeyGenerator().generate()
      log.info('System keys generated')
      const { publicKeyArmored, privateKeyArmored } = keys
      trans.putItem({ ...PK_KEY, publicKeyArmored, privateKeyArmored })
      trans.putItem({ ...PARAMS_KEY, income: mani(100), demurrage: 5.0 }) // TODO: replace hardcoded values
      const maniTable = ledgerTable(trans, '') // TODO: change prefix
      await StateMachine(maniTable)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save())
        .catch(err => log(err, err.stack))
      log.debug('Database update: %j', trans.items())
      log.info('System keys and parameters stored')
      await trans.execute()
      return `SuMsy initialized with ${mani(
        100
      ).format()} income and 5% demurrage.`
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      const maniTable = ledgerTable(table, '') // TODO: change prefix
      return StateMachine(maniTable)
        .getSources({ ledger: '<fingerprint>', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async register (registration) {
      const { publicKeyArmored, payload, alias } = registration
      const ledger = await Verifier(publicKeyArmored).fingerprint()
      const existing = await table.getItem({ ledger, entry: '/current' })
      if (existing) {
        log.info('Ledger was already registered: %s', ledger)
        return ledger // idempotency!
      }
      const transaction = table.transaction()
      const maniTable = ledgerTable(transaction, '') // TODO: change prefix
      // TODO: assert amount = 0
      await StateMachine(maniTable)
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
      log.info('Registered ledger %s', ledger)
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
        log.debug('Applying jubilee to ledger %s', ledger)
        const transaction = table.transaction()
        const maniTable = ledgerTable(transaction, '') // TODO: change prefix
        await StateMachine(maniTable)
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
          .catch(log.error)
        await transaction.execute()
        log.debug('Jubilee succesfully applied to ledger %s', ledger)
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
