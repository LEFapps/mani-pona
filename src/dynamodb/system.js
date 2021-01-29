import { KeyGenerator, KeyWrapper } from '../crypto'
import loglevel from 'loglevel'
import { tools } from '../transaction'

const system = function (table) {
  return {
    async parameters () {
      return table.getItem({ ledger: 'system', entry: 'parameters' }, 'Missing system parameters')
    },
    async init () {
      const keys = await table.getItem({ ledger: 'system', entry: 'pk' })
      const msg = []
      if (!keys) {
        // TODO add both entries in one transactWrite operation
        const keywrapper = await KeyGenerator().generate()
        const { publicKeyArmored, privateKeyArmored } = keywrapper
        await table.putItem({
          ledger: 'system',
          entry: 'pk',
          publicKeyArmored,
          privateKeyArmored
        })
        msg.push('new system keys generated')
        const first = tools.first()
        const signature = await keywrapper.privateKey.signature(first.payload)
        const entry = tools.addPrimarySignature(first, signature)
        await table.putItem(tools.toDb(entry))
        msg.push('initial system entry added')
      } else {
        msg.push('keys found')
      }

      const parameters = await table.getItem({ ledger: 'system', entry: 'parameters' })
      if (!parameters) {
        await table.putItem({
          ledger: 'system',
          entry: 'parameters',
          income: '100 ɱ',
          demurrage: '5.0'
        })
        msg.push('default system parameters generated')
      } else {
        msg.push('system params found')
      }
      const result = `System initialized (${msg.concat(', ')})`
      return result
    },
    async keys () {
      return KeyWrapper(await table.getSingleItem({ ledger: 'system', entry: 'pk' }))
    }
  }
}

export default system
