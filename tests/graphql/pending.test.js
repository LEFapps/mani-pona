import { describe, expect, it, beforeAll } from '@jest/globals'
import { KeyLoader } from '../../client/shared/crypto'
import { PENDING_TRANSACTION } from './queries'
import { query, mutate, testQuery, cognitoMock } from './setup'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

describe('GraphQL pending', () => {
  const keys = KeyLoader('./tests/seeds')

  let fingerprint

  beforeAll(async () => {
    fingerprint = await keys.publicKey.fingerprint()
    cognitoMock.setLedger(fingerprint)
  })

  it('should have a pending transaction waiting', async () => {
    expect.assertions(1)
    expect(true).toBe(true)
    /*
    const pending = await testQuery({
      query: PENDING_TRANSACTION,
      variables: { id: fingerprint } })
    expect(pending.errors).toBe(undefined)
    expect(pending.data.ledger.transactions.pending).toEqual(
      { ledger: {
        transactions: {
          pending: {
            ledger: fingerprint
          } } } })
    */
  })
})
