import * as openpgp from 'openpgp'
import { promises as fs } from 'fs'

class Chest {
  constructor (key) {
    this.key = key
  }
  async loadKeysFromFile (file) {
    this.key = JSON.parse(await fs.readFile(file))
  }

  async writeKeysToFile (file) {
    await fs.writeFile(file, JSON.stringify(this.key))
  }
  async init ({ name, email }) {
    if (this.key === undefined) {
      console.log('Creating new keys')
      this.key = await openpgp.generateKey({
        userIds: [{ name, email }],
        rsaBits: 4096
      })
    }
    const { keys: [privateKey] } = await openpgp.key.readArmored(this.key.privateKeyArmored)
    this.privateKey = privateKey
    const { keys: [publicKey] } = await openpgp.key.readArmored(this.key.publicKeyArmored)
    this.publicKey = publicKey
    this.initialized = true
  }

  get fingerprint () {
    return this.publicKey.getFingerprint()
  }
  /**
   * Creates a (detached) signature for the provided text.
   */
  async sign (txt) {
    const { signature: detachedSignature } = await openpgp.sign({
      message: openpgp.cleartext.fromText(txt),
      privateKeys: [this.privateKey],
      detached: true
    })
    return detachedSignature
  }
}
/**
 * Simplified, asynchronous signature verification that throws Errors when things don't line up. To use:
 *
 * `const fingerprint = await Verifier(key).verify(text, signature)`
 * The Verifier can be reused.
 *
 * @param {string} key - An armored OpenPGP (public) key
 */
const Verifier = (key) => {
  let pk
  return {
    /**
     * @param {string} text - The text that was signed
     * @param {string} signature - The armored and detached OpenPGP signature
     * @returns {string} the fingerprint of the key
     * @throws An error if the input (key or signature) is not in a valid format or if the signature doesn't match.
     */
    verify: async (text, signature) => {
      // deferred parsing and caching of pk:
      if (pk === undefined) {
        const { err, keys: [parsedkey] } = await openpgp.key.readArmored(key)
        if (err) {
          throw err[0]
        }
        pk = parsedkey
      }
      const { signatures } = await openpgp.verify({
        message: openpgp.cleartext.fromText(text),
        signature: await openpgp.signature.readArmored(signature),
        publicKeys: [pk]
      })
      if (signatures[0].valid) {
        return pk.getFingerprint()
      } else {
        throw new Error('The proof signature didn\'t match either this key or the challenge.')
      }
    }
  }
}

export { Chest, Verifier }
