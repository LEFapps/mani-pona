import loglevel from 'loglevel'
import assert from 'assert'
import { KeyGenerator, KeyWrapper, Verifier } from '../crypto'
import { destructure, shadowEntry, continuation, addSignature, addSignatureToTwin, challenge } from './tools'
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
      const current = await SystemTransactions.currentChain()
      const target = {
        ledger: '<fingerprint>',
        sequence: -1,
        next: 'init'
      }
      return challenge(date, current, target, mani(0))
    },
    async register ({ publicKeyArmored, proof, payload, alias }) {
      // TODO: to make this function idempotent, we should simply return with the fingerprint if
      // we already know this publicKey without erroring out
      const { date, from, to, amount } = destructure(payload)
      const verifier = await Verifier(publicKeyArmored)
      const fingerprint = await verifier.fingerprint()
      assert(amount.equals(mani(0)))
      assert(from.ledger === 'system')
      const current = await SystemTransactions.currentChain()
      if (from.sequence !== (current.sequence + 1) || current.next !== from.uid) {
        throw new Error('Incorrect or outdated challenge, please try again')
      }
      assert(to.ledger === fingerprint, 'fingerprint')
      assert(to.sequence === 0, 'sequence')
      assert(to.uid === 'init', 'uid')
      await verifier.verify(payload, proof)
      // TODO: check the date
      // everything seems OK!

      const transaction = SystemTransactions.table.transaction()
      // put public key
      transaction.putItem({
        ledger: fingerprint,
        key: 'pk',
        challenge: payload, // for prosperity
        proof,
        publicKeyArmored,
        alias
      })
      // transaction on system ledger
      transaction.updateItem(current,{
        UpdateExpression: 'set entry = :entry',
        ExpressionAttributeValues: {
          ':entry': sortKey(current)
        }
      }
      const systemEntry = ''
      const keys = KeyWrapper(await SystemTransactions.keys())
      const signature = await keys.privateKey.sign(payload)
      )
      const twin = addSignatureToTwin(cont, 'system', signature)
      await SystemTransactions.saveTwin(twin)

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
    },
    async initLedger (id) {
      const currentSystemEntry = SystemTransactions.current()
      const shadow = shadowEntry(id)
      const cont = continuation(currentSystemEntry, shadow, mani(0))
      const payload = cont.ledger.payload
      const keys = KeyWrapper(await SystemTransactions.keys())
      const signature = await keys.privateKey.sign(payload)
      const twin = addSignatureToTwin(cont, 'system', signature)
      return SystemTransactions.saveTwin(twin)
    },
    async keys () {
      return KeyWrapper(await systemDynamo.keys())
    }
  }
}

export default SystemCore
