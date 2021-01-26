import { jest, describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import mani from '../src/client/currency'
import { KeyLoader } from '../src/crypto'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import log from 'loglevel'
import { REGISTER, CHALLENGE, query, mutate, testQuery } from './graph.setup'

describe('GraphQL error testing', () => {
  const keys = KeyLoader('./tests/test.keys')
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
          balance: mani(0),
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
          balance: mani(0),
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
      query: `
        query ledger($id: String!) {
          ledger(id: $id) {
            transactions {
              all {
                ledger
                balance
                date
              }
            }
          }
        }
      `,
      variables: { id: 'bar' } })
    expect(transactions.errors).toBeDefined()
    expect(transactions.errors[0].message).toEqual('Illegal access attempt detected from foo on bar')
    expect(mockErrorLog.mock.calls.length).toBe(1)
  })
})
