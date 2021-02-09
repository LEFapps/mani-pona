import loglevel from 'loglevel'
import assert from 'assert'
import sha1 from 'sha1'
import Actions from './actions'
import { Transaction } from './transaction'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, continuation, addSignature, challenge, sortKey, toEntry } from './tools'
import { mani } from '../mani'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }

const SystemCore = (systemDynamo, SystemTransactions, userpool) => {
  const table = SystemTransactions.table
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY, 'Missing system parameters')
    },
    async init () {
      console.log('Initializing')
      const results = await (Actions(table)).systemInit()
      console.log(results)
      return results
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      return Transaction(table).create()
        .then((t) => t.addInit('source', '<fingerprint>'))
        .then((t) => t.addCurrent('target', 'system'))
        .then((t) => t.addAmount(mani(0)))
        .then((t) => t.challenge())
    },
    async register ({ publicKeyArmored, signature, counterSignature, payload, alias }) {
      loglevel.info(`Registering ${payload}`)
      const verifier = await Verifier(publicKeyArmored)
      const fingerprint = await verifier.fingerprint()
      // check if the ledger already exists and return identical result (=idempotency)
      const existingPk = await table.getItem({ ledger: fingerprint, entry: 'pk' })
      if (existingPk) {
        loglevel.info(`Ledger was already registered: ${fingerprint}`)
        return fingerprint
      }
      const trans = table.transaction()
      // add the public key
      trans.putItem({
        ledger: fingerprint,
        entry: 'pk',
        created: new Date(),
        challenge: payload, // for prosperity
        proof: signature,
        publicKeyArmored,
        alias
      })
      // add initial transaction
      await Transaction(trans).payload(payload)
        .then((t) => {
          console.log(JSON.stringify(t.context(), null, 2))
          return t
        })
        .then((t) => t.sign(fingerprint, signature, counterSignature, publicKeyArmored))
        .then((t) => t.autosign())
        .then((t) => {
          console.log(JSON.stringify(t.items(), null, 2))
          return t
        })
        .then((t) => t.execute())
      await trans.execute()
      return fingerprint
    },
    async jubilee () {
      const users = await userpool.getUsers()
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      }
      users.forEach((user) => {
        // const curentUser = await SystemTransactions.getItem({ledger: user.ledger, entry: '/current'})
        results.ledgers++
      })
      console.log(results)
      return results
    }
  }
}

export default SystemCore
