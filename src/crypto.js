import * as openpgp from 'openpgp'
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import _ from 'lodash'
import sha1 from 'sha1'

const unpack = async (key) => {
  const { err, keys: [parsedkey] } = await openpgp.key.readArmored(key)
  if (err) {
    throw err[0]
  }
  return parsedkey
}
// reliably sort an objects keys and merge everything into one String
const sortedObjectString = (obj) => {
  return Object.keys(obj).sort().reduce((arr, key) => { arr.push(`${key}:${obj[key]}`); return arr }, []).join('|')
}

const Signer = (key, pk) => {
  const signer = {
    sign: async (input) => {
      assert(!_.isEmpty(input), 'Missing input')
      const text = typeof input === 'string' ? input : sortedObjectString(input)
      pk = pk === undefined ? await unpack(key) : pk // lazy loaded
      const { signature: detachedSignature } = await openpgp.sign({
        message: openpgp.cleartext.fromText(text),
        privateKeys: [pk],
        detached: true
      })
      return detachedSignature
    },
    signature: async (input) => {
      const s = await signer.sign(input)
      const hash = sha1(s)
      return {
        signature: s,
        hash
      }
    }
  }
  return signer
}

/**
 * Simplified, asynchronous signature verification that throws Errors when things don't line up. To use:
 *
 * `const fingerprint = await Verifier(key).verify(text, signature)`
 * The Verifier can be reused.
 *
 * @param {string} key - An armored OpenPGP (public) key
 */
const Verifier = (key, pk) => {
  let fingerprint
  return {
    /**
     * @param {string|object} text - The text or object that was signed
     * @param {string} signature - The armored and detached OpenPGP signature
     * @returns true is the signature matches
     * @throws An error if the input (key or signature) is not in a valid format or if the signature doesn't match.
     */
    verify: async (input, signature) => {
      const text = typeof input === 'string' ? input : sortedObjectString(input)
      pk = pk === undefined ? await unpack(key) : pk
      const { signatures } = await openpgp.verify({
        message: openpgp.cleartext.fromText(text),
        signature: await openpgp.signature.readArmored(signature),
        publicKeys: [pk]
      })
      if (signatures[0].valid) {
        return true
      } else {
        throw new Error('The proof signature didn\'t match either this key or the challenge.')
      }
    },
    fingerprint: async () => {
      if (!fingerprint) {
        pk = pk === undefined ? await unpack(key) : pk
        fingerprint = await pk.getFingerprint()
      }
      return fingerprint
    }
  }
}

const KeyWrapper = (key, pk) => {
  return {
    publicKey: Verifier(key.publicKeyArmored, pk),
    publicKeyArmored: key.publicKeyArmored,
    privateKey: Signer(key.privateKeyArmored, pk),
    privateKeyArmored: key.privateKeyArmored
    // write: async (file) => fs.writeFile(file, JSON.stringify(key))
  }
}
// load from single json file
/*
const KeyLoader = (file) => {
  const key = JSON.parse(fs.readFileSync(file))
  return KeyWrapper(key)
}
*/

// load from separate public.key and private.key files
const KeyLoader = (dir) => {
  const key = {
    publicKeyArmored: fs.readFileSync(path.join(dir, 'public.key'), { encoding: 'utf-8' }),
    privateKeyArmored: fs.readFileSync(path.join(dir, 'private.key'), { encoding: 'utf-8' })
  }
  return KeyWrapper(key)
}

const KeyGenerator = (userId = {}) => {
  return {
    generate: async () => {
      const key = await openpgp.generateKey({
        userIds: [userId],
        rsaBits: 4096
      })
      return KeyWrapper(key, key.key)
    }
  }
}

export { Verifier, Signer, KeyLoader, KeyGenerator, KeyWrapper }
