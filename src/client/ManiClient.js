import log from 'loglevel'
import { get } from 'lodash'
import { gql } from 'apollo-server'
import { KeyManager } from './KeyManager'
import { flip, fromDb } from '../core/tools'

const REGISTER = gql`
  query ($registration: LedgerRegistration!) {
    system {
      register(registration: $registration)
    }
  }`
const CHALLENGE = gql`
  query {
    system {
      challenge
    }
  }`

const CURRENT = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        current {
          ledger
          balance
          date
        }
      }
    }
  }`

const ManiClient = async (graphqlClient, keyStore) => {
  const keyManager = await KeyManager(keyStore)
  const ledger = await keyManager.fingerprint()
  async function query (query, path, variables = {}, required = true) {
    const result = await graphqlClient.query({ query, variables })
    if (result.errors) {
      log.error(result.errors)
      throw new Error(result.errors)
    }
    const obj = get(result.data, path)
    if (required && !obj) {
      throw new Error(`Could not find ${path} in\n${JSON.stringify(result.data)}`)
    }
    return obj
  }
  async function register (alias) {
    const challenge = await query(CHALLENGE, 'system.challenge')
    const payload = challenge.replace('<fingerprint>', ledger)
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
      return fromDb(await query(CURRENT, 'ledger.transactions.current', { id: ledger }))
    }
  }
  return {
    ledger,
    register,
    transactions
  }
}

export { ManiClient }
