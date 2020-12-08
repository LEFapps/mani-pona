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

export { Chest }
