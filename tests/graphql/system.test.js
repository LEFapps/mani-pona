import { describe, expect, it, beforeAll, afterAll } from '@jest/globals'
import AWS from 'aws-sdk-mock'
import { KeyLoader } from '../../src/crypto'
import { mani } from '../../src/mani'
import { SYSTEM_PARAMETERS, JUBILEE } from './queries'
import { query, mutate, testQuery, cognitoMock } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL system parameters and jubilee', () => {
  beforeAll(() => {
    cognitoMock.setAdmin(true)
    AWS.mock('CognitoIdentityServiceProvider', 'listUsers', function (params, callback) {
      callback(null, {
        Users: [

        ]
      })
    })
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
          demurrage: '5.0'
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
        accounts: 1,
        income: 100,
        demurrage: 2.5
      }
    })
  })
})
