import { jest, describe, expect, it, beforeAll } from '@jest/globals'
import { createGenerator } from '@faykah/core'
import { firstNames } from '@faykah/first-names-en'
import { lastNames } from '@faykah/last-names-en'
import { mani } from '../../src/mani'
import { KeyGenerator } from '../../src/crypto'
import { flip } from '../../src/core/tools'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import { REGISTER, CHALLENGE, FIND_KEY, RECENT, INIT } from './queries'
import { query, testMutate, testQuery } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

const generateFirstName = createGenerator(firstNames)
const generateLastName = createGenerator(lastNames)
// make a random name
const generateAlias = () => {
  return `${generateFirstName()} ${generateLastName()}`
}

describe('GraphQL registration', () => {
  beforeAll(async () => {
    cognitoMock.setAdmin(true)
    await testMutate({ mutation: INIT })
    cognitoMock.setAdmin(false)
  })

  it('should register a public key as a new ledger', async () => {
    expect.assertions(10)
    const date = new Date()
    jest.spyOn(global.Date, 'now').mockImplementationOnce(() => date.valueOf())
    const { data: { system: { challenge } } } = await query({ query: CHALLENGE })
    expect(challenge).toEqual(
      expect.stringMatching(new RegExp(
        `/${date.toISOString()}/from/<fingerprint>/000000000000/init/to/system/\\d+/[a-z0-9]+/0,00 ɱ`
      ))
    )
    const newKeys = await KeyGenerator().generate()
    const fingerprint = await newKeys.publicKey.fingerprint()
    const payload = challenge.replace('<fingerprint>', fingerprint)
    const alias = generateAlias()
    const result = await testQuery({
      query: REGISTER,
      variables: {
        registration: {
          publicKeyArmored: newKeys.publicKeyArmored,
          alias,
          signature: await newKeys.privateKey.sign(payload),
          counterSignature: await newKeys.privateKey.sign(flip(payload)),
          payload
        }
      }
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ system: { 'register': fingerprint } })
    // check if we can get the public key
    const verification = await query({
      query: FIND_KEY,
      variables: { id: fingerprint } })
    expect(verification.errors).toBe(undefined)
    expect(verification.data).toEqual({
      system: {
        'findkey': {
          alias,
          publicKeyArmored: newKeys.publicKeyArmored
        } } })

    // we pretend a corresponding cognitoUser now exists as well
    cognitoMock.setLedger(fingerprint)
    const transactions = await testQuery({
      query: RECENT,
      variables: { id: fingerprint } })
    expect(transactions.errors).toBe(undefined)
    const { ledger: { transactions: { recent } } } = transactions.data
    expect(recent.length).toBe(1)
    const balance = recent[0]
    expect(balance.ledger).toEqual(fingerprint)
    expect(mani(balance.balance)).toEqual(mani(0))
    expect(balance.date.getTime()).toEqual(date.getTime())
  })
})
