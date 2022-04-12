import log from 'loglevel'
import { KeyGenerator, KeyWrapper } from '../../shared/crypto'

// interface for keys
const KeyManager = async (store, defaultSet) => {
  const storedKeys = await store.getKeys()
  let keys
  if (storedKeys) {
    log.info('Stored keys found')
    keys = KeyWrapper(storedKeys)
  } else if (defaultSet) {
    log.info('Given keys stored')
    setKeys(defaultSet)
    keys = KeyWrapper(defaultSet)
  }
  async function getKeys (autoGenerate = false) {
    if (!keys && autoGenerate) {
      keys = await KeyGenerator().generate()
      keys.ledger = await keys.publicKey.fingerprint()
      log.info('New keys generated')
      store.saveKeys(keys, autoGenerate) // hacky!!!
      log.info('New keys saved to store')
    }
    return keys
  }
  async function setKeys (keyString, username) {
    let keys = {}
    if (!keyString) keys = await getKeys(username)
    else {
      const privateKeyArmored =
        '-----BEGIN PGP PRIVATE KEY BLOCK-----' +
        keyString
          .split('-----BEGIN PGP PRIVATE KEY BLOCK-----')
          .pop()
          .split('-----END PGP PRIVATE KEY BLOCK-----')
          .shift()
          .replace(/ /g, '\n') +
        '-----END PGP PRIVATE KEY BLOCK-----'
      const publicKeyArmored =
        '-----BEGIN PGP PUBLIC KEY BLOCK-----' +
        keyString
          .split('-----BEGIN PGP PUBLIC KEY BLOCK-----')
          .pop()
          .split('-----END PGP PUBLIC KEY BLOCK-----')
          .shift()
          .replace(/ /g, '\n') +
        '-----END PGP PUBLIC KEY BLOCK-----'
      keys = KeyWrapper({ privateKeyArmored, publicKeyArmored })
    }
    store.saveKeys(keys, username)
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
  async function username () {
    const storedKeys = await getKeys()
    return storedKeys && storedKeys.username
  }
  return {
    getKeys,
    setKeys,
    clear,
    fingerprint,
    username,
    sign
  }
}

export { KeyManager }
