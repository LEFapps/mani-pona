import { jest, describe, expect, it, beforeAll } from '@jest/globals'
import AWS from 'aws-sdk-mock'
import cognitoMock from './cognito.mock'
import { testClient, testMutate, generateAlias } from './setup'
import { INIT, JUBILEE } from './queries'
import { mani } from '../../src/mani'
import { ManiClient } from '../../src/client/ManiClient'

const log = require('util').debuglog('Transactions')

describe('Jubilee', () => {
  let verifiedUser, unverifiedUser, alias

  beforeAll(async () => {
    jest.setTimeout(10000)
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
    expect.assertions(17)
    AWS.mock('CognitoIdentityServiceProvider', 'listUsers', function (params, callback) {
      callback(null, {
        data: {
          Users: [
            {
              Username: alias,
              Attributes: [
                {
                  Name: 'ledger',
                  Value: verifiedUser.id
                }
              ] }] } })
    })
    cognitoMock.setLedger(verifiedUser.id)
    const beforeV = await verifiedUser.transactions.current()
    expect(beforeV.balance).toEqual(mani(0))
    // jubilee
    cognitoMock.setAdmin(true)
    const result = await testMutate({ mutation: JUBILEE })
    const { data: { admin: { jubilee } } } = result
    expect(jubilee).toEqual({
      ledgers: 1,
      demurrage: mani(0).format(),
      income: mani(100).format()
    })
    cognitoMock.setAdmin(false)
    // check user
    cognitoMock.setLedger(verifiedUser.id)
    const pending = await verifiedUser.transactions.pending()
    expect(pending.balance).toEqual(mani(100))
    expect(pending.income).toEqual(mani(100))
    expect(pending.demurrage).toEqual(mani(0))

    // confirm transaction
    const hash = await verifiedUser.transactions.confirm(pending.challenge)
    expect(hash).toHaveLength(40)
    // current balance
    const afterV = await verifiedUser.transactions.current()
    // log(JSON.stringify(afterV, null, 2))
    expect(afterV.balance).toEqual(mani(100))
    expect(afterV.income).toEqual(mani(100))
    expect(afterV.demurrage).toEqual(mani(0))

    const date = new Date()
    jest.spyOn(global.Date, 'now').mockImplementation(() => date.valueOf())
    const challenge = await verifiedUser.transactions.challenge(unverifiedUser.id, mani(-20.15))
    expect(challenge).toEqual(
      expect.stringMatching(new RegExp(
        `/${date.toISOString()}/from/${verifiedUser.id}/0{11}2/[a-z0-9]{40}/to/${unverifiedUser.id}/0{11}1/[a-z0-9]{40}/-20,15 ɱ`
      ))
    )
    log(`Confirming challenge ${challenge}`)
    const confirmHash = await verifiedUser.transactions.create(challenge)
    expect(confirmHash).toHaveLength(40)
    // confirm on the other side
    cognitoMock.setLedger(unverifiedUser.id)
    const confirm = await unverifiedUser.transactions.pending()
    expect(confirm.balance).toEqual(mani(20.15))
    expect(confirm.amount).toEqual(mani(20.15))
    expect(confirm.challenge).toEqual(
      expect.stringMatching(new RegExp(
        `/${date.toISOString()}/from/${unverifiedUser.id}/0{11}1/[a-z0-9]{40}/to/${verifiedUser.id}/0{11}2/[a-z0-9]{40}/20,15 ɱ`
      ))
    )
    const targetHash = await unverifiedUser.transactions.confirm(confirm.challenge)
    expect(targetHash).toHaveLength(40)
    // get current for unverified
    const newCurrentTarget = await unverifiedUser.transactions.current()
    expect(newCurrentTarget.balance).toEqual(mani(20.15))

    cognitoMock.setLedger(verifiedUser.id)
    const newCurrentSource = await verifiedUser.transactions.current()
    expect(newCurrentSource.balance).toEqual(mani(79.85))
  })
})
