import { jest, describe, expect, it } from '@jest/globals'
import { mani } from '../../src/mani'
import { KeyGenerator } from '../../src/crypto'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import { REGISTER, CHALLENGE, FIND_KEY, ALL_TRANSACTIONS } from './queries'
import { query, testMutate, testQuery } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL registration', () => {
  it('should register a public key as a new ledger', async () => {
    expect.assertions(1)
    const date = new Date()
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => date.valueOf())
    const { data: { system: { challenge } } } = await query({ query: CHALLENGE })
    expect(challenge).toEqual(
      expect.stringMatching(new RegExp(
        `/${date.toISOString()}/from/system/\\d+/[a-z0-9]+/to/<fingerprint>/000000000000/init/0,00 ɱ`
      ))
    )
    const newKeys = await KeyGenerator().generate()
    const fingerprint = await newKeys.publicKey.fingerprint()
    const payload = challenge.replace('<fingerprint>', fingerprint)
    const alias = 'Firstname Lastname'
    const result = await testQuery({
      query: REGISTER,
      variables: {
        registration: {
          publicKeyArmored: newKeys.publicKeyArmored,
          alias,
          proof: await newKeys.privateKey.sign(payload),
          payload: challenge
        }
      }
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'register': fingerprint })

    // check if we can get the public key
    const verification = await query({
      query: FIND_KEY,
      variables: { id: fingerprint } })
    expect(verification.errors).toBe(undefined)
    expect(verification.data).toEqual({ 'findkey': {
      alias,
      publicKeyArmored: newKeys.publicKeyArmored
    } })

    // we pretend a corresponding cognitoUser now exists as well
    cognitoMock.setLedger(fingerprint)
    const transactions = await testQuery({
      query: ALL_TRANSACTIONS,
      variables: { id: fingerprint } })
    expect(transactions.errors).toBe(undefined)
    expect(transactions.data.ledger.transactions.all.length).toBe(1)
    const balance = transactions.data.ledger.transactions.all[0]
    expect(balance.ledger).toEqual(fingerprint)
    expect(mani(balance.balance)).toEqual(mani(0))
    expect(balance.date.getTime()).toEqual(date.getTime())
  })
})
