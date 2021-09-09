import log from 'loglevel'
import { KeyGenerator, KeyWrapper } from '../../shared/crypto'
// interface for keys

const KeyManager = async store => {
  const storedKeys = await store.getKeys()
  let keys, hasKeys
  if (storedKeys) {
    hasKeys = true
    log.info('Stored keys found')
    keys = KeyWrapper(storedKeys)
  } else {
    hasKeys = false
    log.info('No stored keys found')
  }
  async function getKeys (autoGenerate) {
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
    hasKeys = !!keys
    return keys
  }
  async function sign (payload) {
    return (await getKeys()).privateKey.sign(payload)
  }
  async function fingerprint () {
    return (await getKeys()).publicKey.fingerprint()
  }
  const getHasKeys = () => hasKeys
  return {
    hasKeys: getHasKeys,
    getKeys,
    setKeys,
    fingerprint,
    sign
  }
}

export { KeyManager }
