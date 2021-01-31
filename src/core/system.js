import { KeyGenerator, KeyWrapper } from '../crypto'
import loglevel from 'loglevel'
import tools from './tools'
import { mani } from '../mani'

const system = (systemStore, systemLedger) => {
  return {
    async init () {
      const msgs = []
      const log = (msg) => {
        loglevel.info(msg)
        msgs.push(msg)
      }
      const keys = await systemStore.keys()
      log('Initializing system')
      if (!keys) {
        const store = systemStore.transactional()
        const ledger = systemLedger.transactional(store.transaction)
        // TODO add both entries in one transactWrite operation
        const keywrapper = await KeyGenerator().generate()
        log('new system keys generated')
        store.saveKeys(keywrapper)
        log('system keys stored')
        // generate first entry
        const shadow = tools.shadowEntry('system')
        const twin = tools.continuation(shadow, shadow, mani(0)) // Ouroboros
        const first = twin.ledger
        const signature = await keywrapper.privateKey.signature(first.payload)
        const entry = tools.addSignature(first, 'system', signature)
        ledger.saveEntry(entry)
        log('system keys added to ledger')
        console.log(JSON.stringify(store.transaction.items(), null, 2))
        await store.transaction.execute()
      } else {
        log('system keys found')
      }

      const parameters = await systemStore.parameters()
      if (!parameters) {
        await systemStore.saveParameters({ income: mani(100), demurrage: 5.0 })
        log('default system parameters generated')
      } else {
        log('system params found')
      }
      return msgs.join(', ')
    },
    async keys () {
      return KeyWrapper(await systemStore.keys())
    }
  }
}

export default system
