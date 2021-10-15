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
      const allowedTypes = userpool.getAccountTypes().map(t => t.type)
      if (!allowedTypes.includes(type)) {
        throw new Error(
          `Unknown account type ${type}, allowed values ${allowedTypes.join(
            ','
          )}`
        )
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
      await StateMachine(trans)
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
    async register (registration, username) {
      const { publicKeyArmored, payload, alias } = registration
      const ledger = await Verifier(publicKeyArmored).fingerprint()
      const existing = await ledgers.current(ledger)
      if (existing) {
        log.info('Ledger was already registered: %s', ledger)
      } else {
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
        log.info('Registered ledger %s in database', ledger)
      }
      const user = await userpool.findUser(username)
      if (!user) {
        throw new Error(`User ${username} not found in userpool.`)
      }
      if (user.ledger) {
        if (user.ledger === ledger) {
          log.info('User account %s already attached to ledger %s', username, ledger)
        } else {
          throw new Error(`Username ${username} is already linked to ledger ${user.ledger}, unable to re-link to ${ledger}`)
        }
      } else {
        userpool.changeAttributes(username, { 'custom:ledger': ledger })
      }
      return ledger
    },
    async forceSystemPayment (ledger, amount) {
      log.debug('Forcing system payment of %s on ledger %s', amount, ledger)
      const pending = await ledgers.pending(ledger)
      if (pending) {
        if (pending.destination === 'system') {
          // idempotency, we assume the client re-submitted
          return 'succes'
        } else {
          throw new Error(
            `There is still a pending transaction on ledger ${ledger}`
          )
        }
      }
      const keys = ledgers.keys('system', true)
      const transaction = ledgers.transaction()
      await StateMachine(transaction)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.addAmount(amount))
        .then(t => t.addSystemSignatures())
        .then(t => t.save())
        .catch(err => log.error('Forced system payment failed\n%s', err))
      await transaction.execute()
      return `Success`
    },
    async jubilee (paginationToken) {
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      // convert to a key-value(s) object for easy lookup
      const types = userpool
        .getAccountTypes()
        .reduce((acc, { type, ...attr }) => {
          acc[type] = attr
          return acc
        }, {})
      async function applyJubilee (ledger, DI) {
        log.debug('Applying jubilee to ledger %s', ledger)
        const transaction = ledgers.transaction()
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addDI(DI))
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
      const {
        users,
        paginationToken: nextToken
      } = await userpool.listJubileeUsers(paginationToken)
      for (let { ledger, type } of users) {
        const DI = type ? types[type] : types['default']
        if (!DI) {
          log.error(
            'SKIPPING JUBILEE: Unable to determine jubilee type %s for ledger %s',
            type,
            ledger
          )
        } else {
          log.debug('Applying jubilee of type %s to ledger %s', type, ledger)
          // these for loops allow await!
          await applyJubilee(ledger, DI)
        }
      }
      return {
        paginationToken: nextToken,
        ...results
      }
    }
  }
}
