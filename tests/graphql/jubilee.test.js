import { describe, expect, it, beforeAll } from '@jest/globals'
import AWS from 'aws-sdk-mock'
import cognitoMock from './cognito.mock'
import { testClient, testMutate, generateAlias } from './setup'
import { INIT, JUBILEE } from './queries'
import { mani } from '../../src/mani'
import { ManiClient } from '../../src/client/ManiClient'

describe('Jubilee', () => {
  let verifiedUser, unverifiedUser, alias

  beforeAll(async () => {
    verifiedUser = await ManiClient(testClient)
    unverifiedUser = await ManiClient(testClient)
    cognitoMock.setAdmin(true)
    await testMutate({ mutation: INIT })
    cognitoMock.setAdmin(false)
    alias = generateAlias()
    await verifiedUser.register(alias)
    await unverifiedUser.register(generateAlias())
  })

  it('should put mani in a verified account', async () => {
    expect.assertions(2)
    AWS.mock('CognitoIdentityServiceProvider', 'listUsers', function (params, callback) {
      callback(null, {
        data: {
          Users: [
            {
              Username: alias,
              Attributes: [
                {
                  Name: 'ledger',
                  Value: verifiedUser.ledger
                }
              ] }] } })
    })
    cognitoMock.setLedger(verifiedUser.ledger)
    const beforeV = await verifiedUser.transactions.current()
    expect(beforeV.balance).toEqual(mani(0))

    cognitoMock.setAdmin(true)
    const result = await testMutate({ mutation: JUBILEE })
    const { data: { admin: { jubilee } } } = result
    expect(jubilee).toEqual({
      ledgers: 1,
      demurrage: mani(0).format(),
      income: mani(100).format()
    })
    cognitoMock.setAdmin(false)
  })
})
