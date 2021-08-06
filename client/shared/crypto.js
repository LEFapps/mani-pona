import * as openpgp from 'openpgp'
import assert from 'assert'
import _ from 'lodash'
import sha1 from 'sha1'

function bugfix () {
  // Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
  // and https://github.com/facebook/jest/issues/9983
  const textEncoding = require('text-encoding-utf-8')
  global.TextEncoder = textEncoding.TextEncoder
  global.TextDecoder = textEncoding.TextDecoder
}

const unpack = async key => {
  const {
    err,
    keys: [parsedkey]
  } = await openpgp.key.readArmored(key)
  if (err) {
    throw err[0]
  }
  return parsedkey
}
// reliably sort an objects keys and merge everything into one String
const sortedObjectString = obj => {
  return Object.keys(obj)
    .sort()
    .reduce((arr, key) => {
      arr.push(`${key}:${obj[key]}`)
      return arr
    }, [])
    .join('|')
}

const Signer = (key, pk) => {
  const signer = {
    sign: async input => {
      bugfix()
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
    signature: async input => {
      // TODO: @deprecated
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
      bugfix()
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
        throw new Error(
          "The proof signature didn't match either this key or the challenge."
        )
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

const KeyGenerator = (userId = {}) => {
  bugfix()
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

export { Verifier, Signer, KeyGenerator, KeyWrapper }
