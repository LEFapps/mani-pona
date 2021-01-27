import { describe, expect, it } from '@jest/globals'
import { MockClient } from '..'
import { mani } from '../src/mani'

describe('mock notifications', () => {
  it('should provide three mocked notifications', async () => {
    expect.assertions(1)
    await expect(new MockClient({}).notifications.all()).resolves.toHaveLength(4)
  })
})

describe('mock transactions', () => {
  it('should reject unknown peerIds', async () => {
    expect.assertions(1)
    await expect(new MockClient({ fail: 'unknown_id' }).transactions.create({ peerId: 'foo' })).rejects.toHaveProperty('message', 'Unknown peerId foo')
  })

  it('should reject transactions without an amount', async () => {
    expect.assertions(1)
    await expect(new MockClient({}).transactions.create({ peerId: 'mock' })).rejects.toHaveProperty('message', 'Unsupported: no amount specified')
  })

  it('should timeout transactions', async () => {
    expect.assertions(1)
    await expect(new MockClient({ fail: 'timeout' }).transactions.create({ peerId: 'mock', amount: 5 })).rejects
      .toHaveProperty('message', 'Transaction timed out')
  })

  it('should return a notification if transaction is succesfull', async () => {
    expect.assertions(1)
    await expect(new MockClient({}).transactions.create({ peerId: 'mock', amount: 5 })).resolves
      .toEqual(
        { 'message': 'Transaction succesfull',
          'amount': mani(5) })
  })

  it('should wait for a confirmation in listen mode', async () => {
    expect.assertions(1)
    await expect(new MockClient({}).transactions.listen()).resolves
      .toEqual(
        { 'message': 'Please confirm transaction',
          'amount': mani(7.5) })
  })

  it('should timeout listen mode', async () => {
    expect.assertions(1)
    await expect(new MockClient({ fail: 'timeout' }).transactions.listen()).rejects
      .toHaveProperty('message', 'Transaction timed out')
  })
})
