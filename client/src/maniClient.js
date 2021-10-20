import { get } from 'lodash'
import loglevel from 'loglevel'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyManager } from './helpers/keymanager'
import { flip, fromDb } from '../shared/tools'
import { mani } from '../shared/mani'
import {
  REGISTER,
  SYSTEM_CHALLENGE,
  CURRENT,
  RECENT,
  PENDING,
  CHALLENGE,
  CREATE,
  CONFIRM,
  CANCEL,
  FIND_KEY,
  FIND_USER,
  DISABLE_USER,
  ENABLE_USER,
  ACCOUNT_TYPES,
  FORCE_SYSTEM_PAYMENT,
  CHANGE_ACCOUNT_TYPE,
  JUBILEE,
  INIT,
  SYSTEM_PARAMETERS,
  TIME
} from '../apollo/queries'

// const log = require('util').debuglog('Transactions')

const log = msg => loglevel.error(msg)

const storageKey = 'mani_client_key_'

function defaultContext () {
  return {}
}
const defaultKeyStore = {
  async getKeys (index = 0) {
    try {
      const key = await AsyncStorage.getItem(storageKey + index)
      if (key !== null) {
        // key previously stored
        return JSON.parse(key)
      }
    } catch (e) {
      // error reading key
      log(e)
    }
  },
  async saveKeys (keys, index = 0) {
    try {
      await AsyncStorage.setItem(storageKey + index, JSON.stringify(keys))
    } catch (e) {
      // saving error
      log(e)
    }
  },
  async removeKeys (index = 0) {
    try {
      await AsyncStorage.removeItem(storageKey + index)
    } catch (e) {
      // removing error
      log(e)
    }
  }
}

const ManiClient = async ({
  graphqlClient,
  keyStore = defaultKeyStore,
  fail = true,
  contextProvider = defaultContext,
  regenerate = false
}) => {
  const keyManager = await KeyManager(keyStore)
  let id = await keyManager.fingerprint(regenerate)
  async function query (query, path, variables = {}, required = true) {
    const result = await graphqlClient.query({
      query,
      variables,
      context: contextProvider(),
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    })
    if (result.errors) {
      log(result.errors)
      if (fail) throw new Error(result.errors[0].message)
    }
    const obj = get(result.data, path)
    if (required && fail && !obj) {
      throw new Error(
        `Could not find ${path} in\n${JSON.stringify(result.data)}`
      )
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
      }
    })
  }
  const transactions = {
    async recent () {
      const recent = await query(RECENT, 'ledger.transactions.recent', {
        id
      })
      // log(JSON.stringify(recent, null, 2))
      return fromDb(recent)
    },
    async current () {
      const current = await query(CURRENT, 'ledger.transactions.current', {
        id
      })
      // log(JSON.stringify(current, null, 2))
      return fromDb(current)
    },
    async pending () {
      const pending = await query(
        PENDING,
        'ledger.transactions.pending',
        { id },
        false
      )
      return fromDb(pending)
    },
    async confirm (challenge) {
      return query(CONFIRM, 'ledger.transactions.confirm', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        }
      })
    },
    async challenge (destination, amount) {
      return query(CHALLENGE, 'ledger.transactions.challenge', {
        id,
        destination,
        amount: amount.format()
      })
    },
    async create (challenge, message) {
      return query(CREATE, 'ledger.transactions.create', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        },
        message
      })
    },
    async cancel (challenge) {
      return query(CANCEL, 'ledger.transactions.cancel', {
        id,
        challenge
      })
    }
  }
  const system = {
    async parameters () {
      return fromDb(
        await query(SYSTEM_PARAMETERS, 'system.parameters', {}, false)
      )
    },
    async findUser (username) {
      return query(FIND_USER, 'system.finduser', { username })
    },
    async accountTypes () {
      return query(ACCOUNT_TYPES, 'system.accountTypes')
    }
  }
  const admin = {
    /**
     * Apply the jubilee to all accounts. Callback is available with intermediate results:
     * `cb({ledgers, demurrage, income}, <is the process finished? true| false>)
     */
    async jubilee (cb = () => {}) {
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      async function jubileeBatch (paginationToken) {
        const { nextToken, ledgers, income, demurrage } = fromDb(
          await query(JUBILEE, 'admin.jubilee', { paginationToken })
        )
        results.income = results.income.add(income)
        results.demurrage = results.demurrage.add(demurrage)
        results.ledgers += ledgers
        if (nextToken) {
          log('Continuing jubilee with paginationToken ' + nextToken)
          cb(results, false)
          await jubileeBatch(nextToken)
        } else {
          log('Finished jubilee: ' + JSON.stringify(results))
          cb(results, true)
        }
      }
      await jubileeBatch()
    },
    async init () {
      return query(INIT, 'admin.init')
    },
    async disableUser (username) {
      return query(DISABLE_USER, 'admin.disableAccount', { username })
    },
    async enableUser (username) {
      return query(ENABLE_USER, 'admin.enableAccount', { username })
    },
    async changeAccountType (username, type) {
      return query(CHANGE_ACCOUNT_TYPE, 'admin.changeAccountType', {
        username,
        type
      })
    },
    async forceSystemPayment (ledger, amount) {
      return query(FORCE_SYSTEM_PAYMENT, 'admin.forceSystemPayment', {
        ledger,
        amount: amount.format()
      })
    },
    async current (ledger) {
      const current = await query(CURRENT, 'ledger.transactions.current', {
        id: ledger
      })
      // log(JSON.stringify(current, null, 2))
      return fromDb(current)
    },
    async pending (ledger) {
      const pending = await query(
        PENDING,
        'ledger.transactions.pending',
        { id: ledger },
        false
      )
      return fromDb(pending)
    }
  }
  return {
    getTime: async () => query(TIME, 'time'),
    id,
    register,
    find,
    transactions,
    system,
    admin,
    importKeys: keyManager.setKeys,
    exposeKeys: keyManager.getKeys,
    cleanup: keyManager.clear
  }
}

export { ManiClient }
export default ManiClient
