import loglevel from 'loglevel'
import assert from 'assert'
import sha1 from 'sha1'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, continuation, addSignature, challenge, sortKey, toEntry } from './tools'
import { mani } from '../mani'

const SystemCore = (systemDynamo, SystemTransactions) => {
  return {
    async parameters () {
      return systemDynamo.parameters()
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      const date = new Date(Date.now())
      const current = await SystemTransactions.current()
      const target = {
        ledger: '<fingerprint>',
        sequence: -1,
        next: 'init'
      }
      return challenge(date, target, current, mani(0))
    },
    async register ({ publicKeyArmored, signature, counterSignature, payload, alias }) {
      loglevel.info(`Registering ${payload}`)
      const userEntry = toEntry(payload)
      // this is the transaction viewed 'from' the system (.../from/system/.../0)
      const systemEntry = toEntry(payload, true)

      const verifier = await Verifier(publicKeyArmored)
      const fingerprint = await verifier.fingerprint()

      // check if the ledger already exists and return identical result (=idempotency)
      const existingPk = await SystemTransactions.table.getItem({ ledger: fingerprint, entry: 'pk' })
      if (existingPk) {
        loglevel.info(`Ledger was already registered: ${fingerprint}`)
        return fingerprint
      }
      // check the transaction (system)
      assert(userEntry.destination === 'system')
      const currentSystemEntry = await SystemTransactions.currentFull()
      if (systemEntry.sequence !== (currentSystemEntry.sequence + 1) || systemEntry.uid !== currentSystemEntry.next) {
        throw new Error('Incorrect or outdated challenge, please try again')
      }
      // check the transaction (user side)
      assert(userEntry.amount.equals(mani(0)))
      assert(userEntry.ledger === fingerprint, 'fingerprint')
      assert(userEntry.sequence === 0, 'sequence')
      assert(userEntry.uid === 'init', 'uid')
      // check signatures
      await verifier.verify(userEntry.payload, signature)
      await verifier.verify(systemEntry.payload, counterSignature)
      // everything seems OK!
      // get system keys
      const systemKeys = KeyWrapper(await systemDynamo.keys())
      if (!systemKeys) {
        throw new Error('System keys not found?!?')
      }

      // start transaction
      const transaction = SystemTransactions.table.transaction()
      // put public key
      transaction.putItem({
        ledger: fingerprint,
        entry: 'pk',
        created: userEntry.date,
        challenge: userEntry.payload, // for prosperity
        proof: signature,
        publicKeyArmored,
        alias
      })
      // make current system entry permanent
      transaction.putItem({
        ...currentSystemEntry,
        'entry': sortKey(currentSystemEntry)
      })
      // clobber current system entry
      const systemSignature = await systemKeys.privateKey.sign(systemEntry.payload)
      transaction.putItem({
        ...systemEntry,
        entry: '/current',
        balance: currentSystemEntry.balance,
        next: sha1(systemSignature),
        signature: systemSignature,
        counterSignature
      })
      // make first ledger entry
      transaction.putItem({
        ...userEntry,
        entry: '/current',
        balance: mani(0),
        next: sha1(signature),
        signature,
        counterSignature: await systemKeys.privateKey.sign(userEntry.payload)
      })
      // commit transaction
      console.log(JSON.stringify(transaction.items(), null, 2))
      console.log('Finished registration')
      await transaction.execute()
      return fingerprint
    },
    async init () {
      const msgs = []
      const log = (msg) => {
        // console.log(msg)
        loglevel.info(msg)
        msgs.push(msg)
      }
      const keys = await systemDynamo.keys()
      log('Initializing system')
      if (!keys) {
        const keywrapper = await KeyGenerator().generate()
        log('new system keys generated')
        await systemDynamo.saveKeys(keywrapper)
        log('system keys stored')
        // generate first entry
        const shadow = shadowEntry('system')
        const twin = continuation(shadow, shadow, mani(0)) // Ouroboros
        const first = twin.ledger
        const signature = await keywrapper.privateKey.signature(first.payload)
        const entry = addSignature(first, 'system', signature)
        await SystemTransactions.saveEntry(entry)
        log('system keys added to ledger')
        // console.log(JSON.stringify(store.transaction.items(), null, 2))
      } else {
        log('system keys found')
      }

      const parameters = await systemDynamo.parameters()
      if (!parameters) {
        await systemDynamo.saveParameters({ income: mani(100), demurrage: 5.0 })
        log('default system parameters generated')
      } else {
        log('system params found')
      }
      return msgs.join(', ')
    }
  }
}

export default SystemCore
