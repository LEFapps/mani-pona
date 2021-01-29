import { describe, expect, it, beforeAll, afterAll } from '@jest/globals'
import AWS from 'aws-sdk-mock'
import { KeyLoader } from '../../src/crypto'
import { mani } from '../../src/mani'
import { INIT, SYSTEM_PARAMETERS, JUBILEE } from './queries'
import { query, mutate, testQuery, testMutate, cognitoMock } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL system parameters and jubilee', () => {
  beforeAll(async () => {
    cognitoMock.setAdmin(true)
    AWS.mock('CognitoIdentityServiceProvider', 'listUsers', function (params, callback) {
      callback(null, {
        Users: [
          {
            Attributes: [
              {
                Name: 'ledger',
                Value: 'test-jubilee'
              }
            ]
          }
        ]
      })
    })
    await testMutate({ mutation: INIT })
  })

  afterAll(() => {
    cognitoMock.setAdmin(false)
    AWS.restore('CognitoIdentityServiceProvider', 'listUsers')
  })

  it('should return the current system parameters', async () => {
    expect.assertions(2)
    const result = await testQuery({
      query: SYSTEM_PARAMETERS
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({
      system: {
        parameters: {
          income: mani(100).format(),
          demurrage: 5.0
        }
      }
    })
  })

  it('should apply the jubilee', async () => {
    const result = await mutate({
      mutation: JUBILEE
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({
      jubilee: {
        ledgers: 1,
        income: '100,00 ɱ',
        demurrage: '2,50 ɱ'
      }
    })
  })
})
