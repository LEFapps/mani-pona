import loglevel from 'loglevel'
import assert from 'assert'
import sha1 from 'sha1'
import { Transaction } from './transaction'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, continuation, addSignature, challenge, sortKey, toEntry } from './tools'
import { mani } from '../mani'

const PARAMS_KEY = { ledger: 'system', entry: 'parameters' }
const PK_KEY = { ledger: 'system', entry: 'pk' }

const SystemCore = (systemDynamo, SystemTransactions, userpool) => {
  const table = SystemTransactions.table
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY, 'Missing system parameters')
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
    async init () {
      const msgs = []
      const log = (msg) => {
        console.log(msg)
        msgs.push(msg)
      }
      let keys = await table.getItem(PK_KEY)
      if (!keys) {
        const trans = table.transaction()
        log('Initializing system')
        keys = await KeyGenerator().generate()
        const { publicKeyArmored, privateKeyArmored } = keys
        await trans.putItem({
          ...PK_KEY,
          publicKeyArmored,
          privateKeyArmored
        })
        log('system keys stored')
        await Transaction(trans).create()
          .then((t) => t.addInit('source', 'system'))
          .then((t) => t.addInit('target', 'system'))
          .then((t) => t.addAmount(mani(0)))
          .then((t) => t.autosign(keys))
          .then((t) => t.execute())
        log('system keys added to ledger')
        await table.putItem({
          ...PARAMS_KEY,
          income: mani(100),
          demurrage: 5.0
        })
        log('default system parameters generated')
        console.log(JSON.stringify(await trans.items(), null, 2))
        await trans.execute()
      } else {
        log('System already initialized')
      }
      return msgs.join(', ')
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
