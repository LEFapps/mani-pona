import StateMachine from './statemachine'
import { KeyGenerator, Verifier, mani } from '../shared'
import { getLogger } from 'server-log'

const PARAMETERS = { income: mani(100), demurrage: 5.0 }
const log = getLogger('core:system')

export default function (ledgers, userpool) {
  return {
    async parameters () {
      return PARAMETERS
    },
    async findkey (fingerprint) {
      return ledgers.publicKey(fingerprint)
    },
    async findUser (username) {
      log.debug('Finding user %s', username)
      return userpool.findUser(username)
    },
    getAccountTypes () {
      return userpool.getAccountTypes()
    },
    async changeAccountType (Username, type) {
      const allowedTypes = userpool.getAccountTypes().map((t) => t.type)
      if (!allowedTypes.includes(type)) {
        throw new Error(`Unknown account type ${type}, allowed values ${allowedTypes.join(',')}`)
      }
      log.debug('Setting account type to %s for user %s', type, Username)
      userpool.changeAttributes(Username, { 'custom:type': type })
    },
    async disableAccount (Username) {
      return userpool.disableAccount(Username)
    },
    async enableAccount (Username) {
      return userpool.enableAccount(Username)
    },
    async init () {
      log.info('System init requested')
      let keys = await ledgers.keys('system')
      log.info('Checking keys')
      if (keys) {
        log.info('System already initialized')
        return // idempotency
      }
      log.info('Generating system keys')
      // initializing fresh system:
      keys = await KeyGenerator({}, log.info).generate()
      log.info('System keys generated')
      const { publicKeyArmored, privateKeyArmored } = keys
      const trans = ledgers.transaction()
      trans.putKey({ ledger: 'system', publicKeyArmored, privateKeyArmored })
      await StateMachine(ledgers)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save())
        .catch(err => log.error('System initialization failed\n%j', err))
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
      return StateMachine(ledgers)
        .getSources({ ledger: '<fingerprint>', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async register (registration) {
      const { publicKeyArmored, payload, alias } = registration
      const ledger = await Verifier(publicKeyArmored).fingerprint()
      const existing = await ledgers.current(ledger)
      if (existing) {
        log.info('Ledger was already registered: %s', ledger)
        return ledger // idempotency!
      }
      const transaction = ledgers.transaction()
      // TODO: assert amount = 0
      await StateMachine(transaction)
        .getPayloads(payload)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.continuePayload())
        .then(t => t.addSystemSignatures())
        .then(t => t.addSignatures({ ledger, ...registration }))
        .then(t => t.save())
      transaction.putKey({
        ledger,
        publicKeyArmored,
        alias,
        challenge: payload
      })
      await transaction.execute()
      log.info('Registered ledger %s', ledger)
      return ledger
    },
    async jubilee (ledger) {
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      async function applyJubilee (ledger) {
        log.debug('Applying jubilee to ledger %s', ledger)
        const transaction = ledgers.transaction()
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addDI(PARAMETERS))
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
      return results
    }
  }
}
