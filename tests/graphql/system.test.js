import { jest, describe, expect, it, beforeAll, beforeEach, afterAll } from '@jest/globals'
import { mani } from '../../src/mani'
import { INIT, SYSTEM_PARAMETERS, TIME } from './queries'
import { testQuery, testMutate, cognitoMock } from './setup'

describe('GraphQL system parameters and time', () => {
  beforeAll(async () => {
    cognitoMock.setAdmin(true)
    await testMutate({ mutation: INIT })
  })

  afterAll(() => {
    cognitoMock.setAdmin(false)
  })
  describe('time', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    const date = new Date(dateISO)
    beforeEach(() => {
      jest.spyOn(global.Date, 'now').mockImplementationOnce(() => date.valueOf())
    })
    it('should provide the current time', async () => {
      expect.assertions(2)
      const result = await testQuery({
        query: TIME
      })
      expect(result.errors).toBe(undefined)
      expect(result.data).toEqual({
        time: date
      })
    })
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
})
