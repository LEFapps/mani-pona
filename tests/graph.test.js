import { jest, describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import mani from '../src/client/currency'
import { KeyLoader, KeyGenerator } from '../src/crypto'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import log from 'loglevel'
import { REGISTER, CHALLENGE, query, mutate, testQuery } from './graph.setup'

// const keyFile = './tests/test.keys'
//

describe('GraphQL', () => {
  const keys = KeyLoader('./tests/test.keys')

  // Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
  const oldTextEncoder = global.TextEncoder
  const oldTextDecoder = global.TextDecoder

  beforeAll(() => {
    const textEncoding = require('text-encoding-utf-8')
    global.TextEncoder = textEncoding.TextEncoder
    global.TextDecoder = textEncoding.TextDecoder
    // read test keys file is it exists
    // await fs.access(keyFile, fsConstants.R_OK).then(() => chest.loadKeysFromFile(keyFile))
    // return chest.init({ name: 'Test', email: 'test@test.com' })
  })

  afterAll(() => {
    global.TextEncoder = oldTextEncoder
    global.TextDecoder = oldTextDecoder
    // write keys file if it doesn't exist yet
    // return fs.access(keyFile, fsConstants.R_OK).catch(() => chest.writeKeysToFile(keyFile))
  })
  // end bugfix

  it('should say hello', async () => {
    const SAY_HELLO = `
      {
        hello
      }
    `
    expect.assertions(2)
    const result = await query({ query: SAY_HELLO })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'hello': 'Hello, world!' })
  })

  describe('Error testing', () => {
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

  it('should register a public key as a new ledger', async () => {
    expect.assertions(10)
    const newKeys = await KeyGenerator().generate()
    const fingerprint = await newKeys.publicKey.fingerprint()
    cognitoMock.setLedger(fingerprint)
    const alias = 'Firstname Lastname'
    const { data } = await query({ query: CHALLENGE })
    expect(data).toEqual({ 'challenge': 'This is my key, verify me' })
    const date = new Date()
    const transaction = {
      ledger: fingerprint,
      balance: mani(0),
      date: new Date(),
      proof: await newKeys.privateKey.sign({
        ledger: fingerprint,
        amount: mani(0),
        date: date.toISOString()
      })
    }
    const result = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: newKeys.publicKeyArmored,
          alias,
          proof: await newKeys.privateKey.sign(data.challenge)
        },
        transaction
      }
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'register': {
      ledger: fingerprint,
      alias
    } })

    const verification = await query({
      query: `
        query findkey ($id: String!) {
          findkey(id: $id) {
            alias
            publicKey
          }
        }
      `,
      variables: { id: fingerprint } })
    expect(verification.errors).toBe(undefined)
    expect(verification.data).toEqual({ 'findkey': {
      alias,
      publicKey: newKeys.publicKeyArmored
    } })
    const transactions = await testQuery({
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
      variables: { id: fingerprint } })
    expect(transactions.errors).toBe(undefined)
    expect(transactions.data.ledger.transactions.all.length).toBe(1)
    const balance = transactions.data.ledger.transactions.all[0]
    expect(balance.ledger).toEqual(fingerprint)
    expect(mani(balance.balance)).toEqual(mani(0))
    expect(balance.date.getTime()).toEqual(date.getTime())
  })
})
