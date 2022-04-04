import StateMachine from './statemachine'
import { KeyGenerator, Verifier, mani } from '../shared'
import { getLogger } from 'server-log'
import { flip, toCSV } from './util'

import columns from '../../client/shared/columns.json'

const log = getLogger('core:system')

export default function (ledgers, userpool) {
  return {
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
      async function initPrimaryLedger (ledger) {
        let keys = await ledgers.keys(ledger)
        log.info('Checking %s keys', ledger)
        if (keys) {
          log.debug('%s ledger is already initialized', ledger)
          return
        }
        log.info('Generating %s keys', ledger)
        // initializing fresh system:
        keys = await KeyGenerator({}, log.info).generate()
        log.info('%s keys generated', ledger)
        const { publicKeyArmored, privateKeyArmored } = keys
        const trans = ledgers.transaction()
        trans.putKey({ ledger, publicKeyArmored, privateKeyArmored })
        await StateMachine(trans)
          .getSources({ ledger, destination: ledger })
          .then(t => t.addAmount(mani(0)))
          .then(t => t.autoSign(ledger, keys))
          .then(t => t.save())
          .catch(err =>
            log.error('%s ledger initialization failed\n%j', ledger, err)
          )
        log.debug('Database update: %j', trans.items())
        await trans.execute()
        log.info('%s ledger keys and parameters stored', ledger)
      }
      await initPrimaryLedger('system')
      await initPrimaryLedger('stripe')
      return `System was initialized.`
    },
    async createPrepaidLedger (amount) {
      log.info('Creating prepaid (account-less) ledger with amount %s', amount)
      // generate keys for new account
      const keys = await KeyGenerator({}, log.info).generate()
      const ledger = await keys.publicKey.fingerprint()
      log.info('Prepaid ledger keys generated, id %s', ledger)
      // prepare for initial transaction
      try {
        const transaction = ledgers.transaction()
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addAmount(amount))
          .then(t => t.autoSign('system'))
          .then(t => t.autoSign(ledger, keys))
          .then(t => t.save())
        transaction.putKey({
          ledger,
          publicKeyArmored: keys.publicKeyArmored,
          privateKeyArmored: keys.privateKeyArmored,
          alias: 'Prepaid card'
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
          .then(t => t.autoSign('system'))
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
        .then(t => t.autoSign('system'))
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
    async exportLedgers (lang = 'nl') {
      // note: at some point this will run into performance issues of course
      // we'd need to switch to e.g. an S3 based approach
      const atts = ledgers.exportAttributes()
      const items = await ledgers.exportAll()
      return toCSV(atts, items, att => columns[lang][att] || att)
    },
    async exportAccounts (lang = 'nl') {
      const { users } = await userpool.listJubileeUsers()
      const atts = [
        'alias',
        'email',
        'phone',
        'address',
        'zip',
        'city',
        'birthday',
        'type',
        'administrator',
        'created'
      ]
      return toCSV(atts, users, att => columns[lang][att] || att)
    }
  }
}
