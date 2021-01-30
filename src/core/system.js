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
        // TODO add both entries in one transactWrite operation
        const keywrapper = await KeyGenerator().generate()
        log('new system keys generated')
        await systemStore.saveKeys(keywrapper)
        log('system keys stored')
        // generate first entry
        const first = tools.first()
        const signature = await keywrapper.privateKey.signature(first.payload)
        const entry = tools.addPrimarySignature(first, signature)
        await systemLedger.saveEntry(entry)
        log('system keys added to ledger')
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
