import { get } from 'lodash'
import loglevel from 'loglevel'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { KeyManager } from './helpers/keymanager'
import { flip, fromDb } from '../shared/tools'
import { mani } from '../shared/mani'
// import { KeyWrapper } from '../shared/crypto'
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
  EXPORT,
  FIND_KEY,
  FIND_USER,
  DISABLE_USER,
  ENABLE_USER,
  ACCOUNT_TYPES,
  FORCE_SYSTEM_PAYMENT,
  CREATE_PREPAID_LEDGER,
  CHANGE_ACCOUNT_TYPE,
  JUBILEE,
  EXPORT_LEDGERS,
  INIT,
  SYSTEM_PARAMETERS,
  TIME
} from '../apollo/queries'

// const log = require('util').debuglog('Transactions')

const log = msg => loglevel.error(msg)

function defaultContext () {
  return {}
}

export const keyWarehouse = {
  async list () {
    let storageKeys = []
    // map AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys()
      storageKeys = allKeys.filter(k => k.indexOf('mani_client_key_') === 0)
    } catch (e) {
      console.error('KeyStorage LIST', e)
    }

    // returns storageKey + usernames (e-mail)
    return Promise.all(
      storageKeys.map(async key => {
        const fromStore = await AsyncStorage.getItem(key)
        const stored = JSON.parse(fromStore)
        return { key, username: stored && stored.username }
      })
    )
  },

  getKeyStore (storageKey) {
    return {
      async getKeys () {
        try {
          const key = await AsyncStorage.getItem(storageKey)
          if (key !== null) {
            // key previously stored
            return JSON.parse(key)
          }
        } catch (e) {
          // error reading key
          log(e)
        }
      },
      async saveKeys (keys, username) {
        try {
          await AsyncStorage.setItem(
            storageKey,
            JSON.stringify({ ...keys, username })
          )
        } catch (e) {
          // saving error
          log(e)
        }
      },
      async removeKeys () {
        try {
          await AsyncStorage.removeItem(storageKey)
        } catch (e) {
          // removing error
          log(e)
        }
      }
    }
  }
}

const ManiClient = async ({
  graphqlClient,
  storageKey,
  fail = true,
  contextProvider = defaultContext,
  regenerate = false
}) => {
  const keyManager = await KeyManager(keyWarehouse.getKeyStore(storageKey))
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
    const username = await keyManager.username()
    return query(REGISTER, 'system.register', {
      username,
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
    async create (challenge, message, prepaid) {
      return query(CREATE, 'ledger.transactions.create', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        },
        message,
        prepaid
      })
    },
    async cancel (challenge) {
      return query(CANCEL, 'ledger.transactions.cancel', {
        id,
        challenge
      })
    },
    async export (ledger) {
      return query(EXPORT, 'ledger.transactions.export', { id: ledger || id })
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
    // note that this amount is from the POV of the system, so it must be *negative* to make sense.
    // returns ledger id (for QR generation)
    async createPrepaidLedger (amount) {
      return query(CREATE_PREPAID_LEDGER, 'admin.createPrepaidLedger', {
        amount: amount.format()
      })
    },
    async exportLedgers () {
      return query(EXPORT_LEDGERS, 'admin.exportLedgers')
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
