import { jest, describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import { mani } from '../../src/mani'
import { KeyLoader } from '../../src/crypto'
// import fs from 'fs'
import log from 'loglevel'
import { ALL_TRANSACTIONS, REGISTER, JUBILEE } from './queries'
import { query, mutate, cognitoMock } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL error testing', () => {
  const keys = KeyLoader('./tests/seeds')
  let mockErrorLog

  beforeEach(() => {
    mockErrorLog = jest.fn()
    jest.spyOn(log, 'error').mockImplementation(mockErrorLog)
  })

  afterEach(() => {
    jest.spyOn(log, 'error').mockRestore()
  })

  it('should reject misformed armor during registration', async () => {
    expect.assertions(3)
    const BAD_KEY = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: 'NOT A KEY',
          alias: 'Oops',
          proof: 'foobar'
        },
        transaction: {
          ledger: '',
          balance: 0,
          date: new Date(),
          proof: ''
        }
      }
    })
    expect(BAD_KEY.errors).toBeDefined()
    expect(BAD_KEY.errors[0].message).toEqual('Error: Misformed armored text')
    expect(mockErrorLog.mock.calls.length).toBe(1)
  })

  it('should reject bad proof during registration', async () => {
    expect.assertions(3)
    const BAD_PROOF = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: keys.publicKeyArmored,
          alias: 'Sorry',
          proof: 'foobar'
        },
        transaction: {
          ledger: '',
          balance: 0,
          date: new Date(),
          proof: ''
        }
      }
    })
    expect(BAD_PROOF.errors).toBeDefined()
    expect(BAD_PROOF.errors[0].message).toEqual('Error: Misformed armored text')
    expect(mockErrorLog.mock.calls.length).toBe(1)
  })

  it('should deny access to a non-authorized user on a ledger', async () => {
    expect.assertions(3)
    cognitoMock.setLedger('foo')
    const transactions = await query({
      query: ALL_TRANSACTIONS,
      variables: { id: 'bar' } })
    expect(transactions.errors).toBeDefined()
    expect(transactions.errors[0].message).toEqual('Illegal access attempt detected from foo on bar')
    expect(mockErrorLog.mock.calls.length).toBe(1)
  })

  it('should deny access to the jubilee', async () => {
    expect.assertions(3)
    const result = await mutate({
      mutation: JUBILEE
    })
    expect(result.errors).toBeDefined()
    expect(result.errors[0].message).toEqual('Unauthorized access')
    expect(mockErrorLog.mock.calls.length).toBe(1)
  })
})
