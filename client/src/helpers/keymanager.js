import log from 'loglevel'
import { KeyGenerator, KeyWrapper } from '../../shared/crypto'
// interface for keys

const KeyManager = async store => {
  const storedKeys = store.getKeys()
  let keys
  if (storedKeys) {
    log.info('Stored keys found')
    keys = KeyWrapper(storedKeys)
  }
  async function getKeys () {
    if (!keys) {
      keys = await KeyGenerator().generate()
      keys.ledger = await keys.publicKey.fingerprint()
      log.info('New keys generated')
      store.saveKeys(keys)
      log.info('New keys saved to store')
    }
    return keys
  }
  async function sign (payload) {
    return (await getKeys()).privateKey.sign(payload)
  }
  async function fingerprint () {
    return (await getKeys()).publicKey.fingerprint()
  }
  return {
    getKeys,
    fingerprint,
    sign
  }
}

export { KeyManager }
