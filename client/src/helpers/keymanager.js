import log from 'loglevel'
import { KeyGenerator, KeyWrapper } from '../../shared/crypto'
// interface for keys

const KeyManager = async store => {
  const storedKeys = await store.getKeys()
  let keys
  if (storedKeys) {
    log.info('Stored keys found')
    keys = KeyWrapper(storedKeys)
  }
  async function getKeys (autoGenerate = false) {
    if (!keys && autoGenerate) {
      keys = await KeyGenerator().generate()
      keys.ledger = await keys.publicKey.fingerprint()
      log.info('New keys generated')
      store.saveKeys(keys)
      log.info('New keys saved to store')
    }
    return keys
  }
  async function setKeys (keyString) {
    if (!keyString) {
      return await getKeys(true)
    }
    const privateKeyArmored =
      '-----BEGIN PGP PRIVATE KEY BLOCK-----' +
      keyString
        .split('-----BEGIN PGP PRIVATE KEY BLOCK-----')
        .pop()
        .split('-----END PGP PRIVATE KEY BLOCK-----')
        .shift() +
      '-----END PGP PRIVATE KEY BLOCK-----'
    const publicKeyArmored =
      '-----BEGIN PGP PUBLIC KEY BLOCK-----' +
      keyString
        .split('-----BEGIN PGP PUBLIC KEY BLOCK-----')
        .pop()
        .split('-----END PGP PUBLIC KEY BLOCK-----')
        .shift() +
      '-----END PGP PUBLIC KEY BLOCK-----'

    keys = KeyWrapper({ privateKeyArmored, publicKeyArmored })
    store.saveKeys(keys)
    return keys
  }
  async function clear () {
    return await store.removeKeys()
  }
  async function sign (payload) {
    const storedKeys = await getKeys()
    return storedKeys && storedKeys.privateKey.sign(payload)
  }
  async function fingerprint () {
    const storedKeys = await getKeys()
    return storedKeys && storedKeys.publicKey.fingerprint()
  }
  return {
    getKeys,
    setKeys,
    clear,
    fingerprint,
    sign
  }
}

export { KeyManager }
