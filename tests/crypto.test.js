import { KeyGenerator } from '../src/crypto'
import { describe, expect, it } from '@jest/globals'

describe('Crypto', () => {
  it('should generate keys', async () => {
    let keys = await KeyGenerator().generate()
    expect(keys.publicKeyArmored).toBeDefined()
    expect(keys.privateKeyArmored).toBeDefined()
  })
})
