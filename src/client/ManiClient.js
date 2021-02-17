import { get } from 'lodash'
import loglevel from 'loglevel'
import { KeyManager } from './KeyManager'
import { flip, fromDb } from '../core/tools'
import { REGISTER, SYSTEM_CHALLENGE, CURRENT, PENDING, CHALLENGE, CREATE, CONFIRM, CANCEL, FIND_KEY, JUBILEE, INIT, SYSTEM_PARAMETERS } from './queries'

// const log = require('util').debuglog('Transactions')

const log = (msg) => loglevel.error(msg)

function defaultContext () { return {} }
const defaultKeyStore = {
  async getKeys () {
    // TODO
  },
  async saveKeys (keys) {
    // TODO
  }
}

const ManiClient = async ({ graphqlClient, keyStore = defaultKeyStore, fail = true, contextProvider = defaultContext }) => {
  const keyManager = await KeyManager(keyStore)
  const id = await keyManager.fingerprint()
  async function query (query, path, variables = {}, required = true) {
    const result = await graphqlClient.query({ query, variables, context: contextProvider(), fetchPolicy: 'no-cache' })
    if (result.errors) {
      log(result.errors)
      if (fail) throw new Error(result.errors)
    }
    const obj = get(result.data, path)
    if (required && fail && !obj) {
      throw new Error(`Could not find ${path} in\n${JSON.stringify(result.data)}`)
    }
    return obj
  }
  async function find (ledger) {
    return query(FIND_KEY, 'system.findkey.alias', { id: ledger }, false)
  }
  async function register (alias) {
    const challenge = await query(SYSTEM_CHALLENGE, 'system.challenge')
    const payload = challenge.replace('<fingerprint>', id)
    return query(REGISTER, 'system.register', {
      registration: {
        publicKeyArmored: (await keyManager.getKeys()).publicKeyArmored,
        alias,
        signature: await keyManager.sign(payload),
        counterSignature: await keyManager.sign(flip(payload)),
        payload
      } })
  }
  const transactions = {
    async current () {
      const current = await query(CURRENT, 'ledger.transactions.current', { id })
      // log(JSON.stringify(current, null, 2))
      return fromDb(current)
    },
    async pending () {
      const pending = await query(PENDING, 'ledger.transactions.pending', { id }, false)
      return fromDb(pending)
    },
    async confirm (challenge) {
      return query(CONFIRM, 'ledger.transactions.confirm', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        } })
    },
    async challenge (destination, amount) {
      return query(CHALLENGE, 'ledger.transactions.challenge', { id, destination, amount: amount.format() })
    },
    async create (challenge) {
      return query(CREATE, 'ledger.transactions.create', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        } })
    },
    async cancel (challenge) {
      return query(CANCEL, 'ledger.transactions.cancel', { id, challenge })
    }
  }
  const system = {
    async parameters () {
      return fromDb(await query(SYSTEM_PARAMETERS, 'system.parameters', {}, false))
    }
  }
  const admin = {
    async jubilee () {
      return fromDb(await query(JUBILEE, 'admin.jubilee', { ledger: id }))
    },
    async init () {
      return query(INIT, 'admin.init')
    }
  }
  return {
    id,
    register,
    find,
    transactions,
    system,
    admin
  }
}

export { ManiClient }
