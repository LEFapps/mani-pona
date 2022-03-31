import StateMachine from './statemachine'
import { KeyGenerator, Verifier, mani } from '../shared'
import { getLogger } from 'server-log'
import { flip, toCSV } from './util'

import columns from '../../client/shared/columns.json'

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
      await userpool.changeAttributes(Username, { 'custom:type': type })
      const user = await userpool.findUser(Username)
      await ledgers.addAccountType(user.ledger, type)
      return `User ${Username} set to type ${type}`
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
        log.debug('System already initialized %j', keys)
        return 'System already initialized' // idempotency
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
      return `System was initialized.`
    },
    async createPrepaidLedger (amount) {
      log.info('Creating prepaid (account-less) ledger with amount %s', amount)
      // generate keys for new account
      const keys = await KeyGenerator({}, log.info).generate()
      const ledger = await keys.publicKey.fingerprint()
      const { publicKeyArmored, privateKeyArmored } = keys
      log.info('Prepaid ledger keys generated, id %s', ledger)
      // prepare for initial transaction
      const challenge = await StateMachine(ledgers)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
        .catch(err => log.error('Creation of challenge failed %s\n%s', err, err.stack))
      if (!challenge) { throw new Error('Challenge creation failed') }
      log.info('Generated challenge for prepaid ledger: %s', challenge)
      const signature = await keys.privateKey.sign(challenge)
      const counterSignature = await keys.privateKey.sign(flip(challenge))
      log.debug('Prepared initial transaction on prepaid ledger:\n%s\nsignature:\n%s\ncountersignature:\n%s', challenge, signature, counterSignature)
      try {
        const transaction = ledgers.transaction()
        await StateMachine(transaction)
          .getPayloads(challenge)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.continuePayload())
          .then(t => t.addSystemSignatures())
          .then(t => t.addSignatures({ ledger, signature, counterSignature, publicKeyArmored }))
          .then(t => t.save())
        transaction.putKey({
          ledger,
          publicKeyArmored,
          privateKeyArmored,
          alias: 'Prepaid card',
          accountType: 'prepaid',
          challenge
        })
        await transaction.execute()
        log.info('Registered prepaid ledger %s in database', ledger)
        return ledger
      } catch (err) {
        log.error('Creation of prepaid ledger failed: %s\n%s', err, err.stack)
        throw new Error('Creation of prepaid ledger failed, please check logs.')
      }
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
      log.debug('REGISTERING %s', username)
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
        await transaction.putEntry({
          ledger,
          entry: 'notification',
          value: 'register'
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
          log.info(
            'User account %s already attached to ledger %s',
            username,
            ledger
          )
        } else {
          throw new Error(
            `Username ${username} is already linked to ledger ${user.ledger}, unable to re-link to ${ledger}`
          )
        }
      } else {
        await userpool.changeAttributes(username, { 'custom:ledger': ledger })
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
      const transaction = ledgers.transaction()
      await StateMachine(transaction)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.addAmount(amount))
        .then(t => t.addSystemSignatures())
        .then(t => t.save())
        .catch(err => log.error('Forced system payment failed\n%s', err))
      await transaction.putEntry({
        ledger,
        entry: 'notification',
        value: 'forceSystemPayment'
      })
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
    },
    async exportLedgers (lang = 'nl') {
      // note: at some point this will run into performance issues of course
      // we'd need to switch to e.g. an S3 based approach
      const atts = ledgers.exportAttributes()
      const items = await ledgers.exportAll()
      return toCSV(atts, items, att => columns[lang][att] || att)
    }
  }
}
