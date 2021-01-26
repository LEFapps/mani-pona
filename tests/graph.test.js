import { describe, expect, it } from '@jest/globals'
import mani from '../src/client/currency'
import { KeyGenerator } from '../src/crypto'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import { SAY_HELLO, REGISTER, CHALLENGE, query, mutate, testQuery } from './graph.setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL registration', () => {
  it('should say hello', async () => {
    expect.assertions(2)
    const result = await query({ query: SAY_HELLO })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'hello': 'Hello, world!' })
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
