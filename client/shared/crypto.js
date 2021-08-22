import { readKey, readPrivateKey, sign, verify, createMessage, readSignature, generateKey } from 'openpgp'

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
/**
 * Sign with private key. You can pass the already parse privateKey if you have it, otherwise it will be lazy loaded from the armored version.
 */
const Signer = (armoredPrivateKey, privateKey) => {
  const signer = {
    sign: async input => {
      // assert(!_.isEmpty(input), 'Missing input')
      const text = typeof input === 'string' ? input : sortedObjectString(input)
      privateKey = privateKey === undefined ? await readPrivateKey({ armoredKey: armoredPrivateKey }) : privateKey // lazy loaded
      return sign({
        message: await createMessage({ text }),
        signingKeys: privateKey,
        detached: true
      })
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
const Verifier = (armoredPublicKey, publicKey) => {
  let fingerprint
  return {
    /**
     * @param {string|object} text - The text or object that was signed
     * @param {string} signature - The armored and detached OpenPGP signature
     * @returns true is the signature matches
     * @throws An error if the input (key or signature) is not in a valid format or if the signature doesn't match.
     */
    verify: async (input, armoredSignature) => {
      const text = typeof input === 'string' ? input : sortedObjectString(input)
      publicKey = publicKey === undefined ? await readKey({ armoredKey: armoredPublicKey }) : publicKey // lazy loaded
      await verify({
        message: await createMessage({ text }),
        signature: await readSignature({ armoredSignature }),
        verificationKeys: publicKey,
        expectSigned: true // automatically throws an error
      })
      return true
    },
    fingerprint: async () => {
      if (!fingerprint) {
        publicKey = publicKey === undefined ? await readKey({ armoredKey: armoredPublicKey }) : publicKey // lazy loaded
        fingerprint = publicKey.getFingerprint()
      }
      return fingerprint
    }
  }
}

const KeyWrapper = (key) => {
  return {
    publicKey: Verifier(key.publicKeyArmored),
    publicKeyArmored: key.publicKeyArmored,
    privateKey: Signer(key.privateKeyArmored),
    privateKeyArmored: key.privateKeyArmored
  }
}

const KeyGenerator = (userId = {}) => {
  return {
    generate: async () => {
      // simply add 'passphrase' as an option here to protect the key:
      const key = await generateKey({
        userIDs: userId,
        type: 'rsa',
        rsaBits: 4096,
        format: 'object'
      })
      return {
        publicKey: Verifier(key.publicKey.armor(), key.publicKey),
        publicKeyArmored: key.publicKey.armor(),
        privateKey: Signer(key.privateKey.armor(), key.privateKey),
        privateKeyArmored: key.privateKey.armor()
      }
    }
  }
}

export { Verifier, Signer, KeyGenerator, KeyWrapper }
