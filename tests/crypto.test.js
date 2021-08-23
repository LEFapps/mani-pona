import { KeyGenerator, KeyWrapper } from 'shared'
import { readPrivateKey, createMessage, sign } from 'openpgp'
import { describe, expect, it } from '@jest/globals'
import { getLogger } from 'server-log'

const log = getLogger('tests:crypto')

describe('Crypto', () => {
  it('should generate keys and sign/verify', async () => {
    let keys = await KeyGenerator().generate()
    expect(keys.publicKeyArmored).toBeDefined()
    expect(keys.privateKeyArmored).toBeDefined()
    log.debug('Private key: \n%s', keys.privateKeyArmored)
    const sample = 'sample text'
    const signature = await keys.privateKey.sign(sample)
    log.debug('Signature:\n %j', signature)
    await expect(keys.publicKey.verify(sample, signature)).resolves.toBe(true)
    const { publicKeyArmored, privateKeyArmored } = keys
    const wrapper = KeyWrapper({ publicKeyArmored, privateKeyArmored })
    const signature2 = await wrapper.privateKey.sign(sample)
    expect(signature2).toBeDefined()
  })

  it('should sign using detached key', async () => {
    const armoredKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYSN3whYJKwYBBAHaRw8BAQdAJqyTaLrg3G+Gy4t4A0Hz1pldEyLl3/f+
4iFhb6kWQR8AAP99kL330RtG2Zu1DElxL3BVUrPz7BXC39IRVa7sbq2zMRJA
zQDCjAQQFgoAHQUCYSN3wgQLCQcIAxUICgQWAAIBAhkBAhsDAh4BACEJEGGO
zFqTGoarFiEEZfFaFbFBLUjvwK8WYY7MWpMahqskzwEAwW9Vc2jKZipl++nm
y4nEVYTvHvz8PePmJf/ImY8KZvABALEvP/2KwfwDpD5x9hnGnQICBgXkCWSd
BTw8X2uI2RIEx10EYSN3whIKKwYBBAGXVQEFAQEHQCKa9Au/1a9BMRTh0rav
NIuyIUZ9cJoMYkRsqvDIiRFMAwEIBwAA/3eOjm7wOU+f3hUVyHyr/k+orQhb
AOe/c9GjwLg64cDIErvCeAQYFggACQUCYSN3wgIbDAAhCRBhjsxakxqGqxYh
BGXxWhWxQS1I78CvFmGOzFqTGoarUJ0A/2AQvcQVNZGptYQoseOBjNxCTjo0
vnszNIiYik2UWfM2AP4zIPf2n7S9EedIpBpyI2wQKNUbT3zgmBFbCY3dh0/n
AA==
=+rUH
-----END PGP PRIVATE KEY BLOCK-----`
    // const privateKey = await decryptKey({ privateKey: await readPrivateKey({ armoredKey }) })
    const privateKey = await readPrivateKey({ armoredKey })
    expect(privateKey.isPrivate()).toBe(true)
    expect(privateKey.isDecrypted()).toBe(true)
    await expect(privateKey.validate()).resolves.toBe(undefined)
    const message = await createMessage({ text: 'sample text' })
    const sig = await sign({
      message,
      signingKeys: privateKey,
      detached: true
    })
    expect(sig).toBeDefined()
    log.debug('Signature from key:\n', sig)
  })
})
