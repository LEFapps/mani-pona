import { get } from 'lodash'
import { KeyManager } from './KeyManager'
import { flip, fromDb } from '../core/tools'
import { REGISTER, SYSTEM_CHALLENGE, CURRENT, PENDING, CHALLENGE, CREATE, CONFIRM } from './queries'

const log = require('util').debuglog('Transactions')

const ManiClient = async (graphqlClient, keyStore) => {
  const keyManager = await KeyManager(keyStore)
  const id = await keyManager.fingerprint()
  async function query (query, path, variables = {}, required = true) {
    const result = await graphqlClient.query({ query, variables })
    if (result.errors) {
      log(result.errors)
      throw new Error(result.errors)
    }
    const obj = get(result.data, path)
    if (required && !obj) {
      throw new Error(`Could not find ${path} in\n${JSON.stringify(result.data)}`)
    }
    return obj
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
      log(JSON.stringify(current, null, 2))
      return fromDb(current)
    },
    async pending () {
      const pending = await query(PENDING, 'ledger.transactions.pending', { id })
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
    }
  }
  return {
    id,
    register,
    transactions
  }
}

export { ManiClient }
