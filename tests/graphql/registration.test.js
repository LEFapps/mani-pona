import { jest, describe, expect, it, beforeAll } from '@jest/globals'
import { mani, KeyManager, flip } from '../shared'
import cognitoMock from './cognito.mock'
// import fs from 'fs'
import { REGISTER, CHALLENGE, FIND_KEY, RECENT, INIT } from './queries'
import { query, testMutate, testQuery, generateAlias } from './setup'

describe('GraphQL registration', () => {
  beforeAll(async () => {
    cognitoMock.setAdmin(true)
    await testMutate({ mutation: INIT })
    cognitoMock.setAdmin(false)
  })

  it('should register a public key as a new ledger', async () => {
    expect.assertions(10)
    const date = new Date()
    jest.spyOn(global.Date, 'now').mockImplementation(() => date.valueOf())
    const {
      data: {
        system: { challenge }
      }
    } = await query({ query: CHALLENGE })
    expect(challenge).toEqual(
      expect.stringMatching(
        new RegExp(
          `/${date.toISOString()}/from/<fingerprint>/0{12}/init/to/system/\\d{12}/[a-z0-9]+/0,00 ɱ`
        )
      )
    )
    const keyManager = await KeyManager()
    const newKeys = await keyManager.getKeys()
    const fingerprint = await keyManager.fingerprint()
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
    expect(result.data).toEqual({ system: { register: fingerprint } })
    // check if we can get the public key
    const verification = await query({
      query: FIND_KEY,
      variables: { id: fingerprint }
    })
    expect(verification.errors).toBe(undefined)
    expect(verification.data).toEqual({
      system: {
        findkey: {
          alias,
          publicKeyArmored: newKeys.publicKeyArmored
        }
      }
    })

    // we pretend a corresponding cognitoUser now exists as well
    cognitoMock.setLedger(fingerprint)
    const transactions = await testQuery({
      query: RECENT,
      variables: { id: fingerprint }
    })
    expect(transactions.errors).toBe(undefined)
    const {
      ledger: {
        transactions: { recent }
      }
    } = transactions.data
    expect(recent.length).toBe(1)
    const balance = recent[0]
    expect(balance.ledger).toEqual(fingerprint)
    expect(mani(balance.balance)).toEqual(mani(0))
    expect(balance.date.getTime()).toEqual(date.getTime())
  })
})
