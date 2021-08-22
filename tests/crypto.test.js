import { KeyGenerator } from 'shared'
import { describe, expect, it } from '@jest/globals'
import { getLogger } from 'server-log'

const log = getLogger('tests:crypto')

describe('Crypto', () => {
  it('should generate keys and sign/verify', async () => {
    let keys = await KeyGenerator().generate()
    expect(keys.publicKeyArmored).toBeDefined()
    expect(keys.privateKeyArmored).toBeDefined()
    const sample = 'sample text'
    const signature = await keys.privateKey.sign(sample)
    log.debug('Signature:\n %j', signature)
    await expect(keys.publicKey.verify(sample, signature)).resolves.toBe(true)
  })
})
