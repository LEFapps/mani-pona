import { jest, describe, expect, it, beforeEach } from '@jest/globals'
import crypto from 'crypto'
import { tools } from '../src/transaction/'
import { mani } from '../src/mani'

describe('Transaction tools', () => {
  it('should pad numbers', () => {
    expect(tools.pad(123)).toEqual('000000000123')
  })
  it('should know the other party', () => {
    expect(tools.other('ledger')).toEqual('destination')
    expect(tools.other('destination')).toEqual('ledger')
  })
  // TODO: add 'check' test
  describe('continued transactions', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    const date = new Date(dateISO)
    // const otherDate = new Date('2021-01-25T00:00:00.000Z')
    const hash = (str) => crypto.createHash('sha1').update(str).digest('hex') // we use this to fake fingerprints and signatures
    beforeEach(() => {
      jest.spyOn(global.Date, 'now').mockImplementationOnce(() => date.valueOf())
    })
    it('should create a transaction twin', () => {
      const source = {
        ledger: 'ledger1',
        entry: '/current',
        sequence: 12,
        next: 'nextuida',
        balance: mani(101.1)
      }
      const target = {
        ledger: 'ledger2',
        entry: '/current',
        sequence: 23,
        next: 'nextuidb',
        balance: mani(77.55)
      }
      expect(tools.check(source)).toBe(true)
      expect(tools.check(target)).toBe(true)
      expect(tools.continuation(source, target, mani(-7.35))).toEqual({
        ledger: {
          ledger: 'ledger1',
          destination: 'ledger2',
          entry: 'pending',
          sequence: 13,
          uid: 'nextuida',
          date: date,
          amount: mani(-7.35),
          balance: mani(93.75),
          payload: `/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/-7,35 ɱ`
        },
        destination: {
          ledger: 'ledger2',
          destination: 'ledger1',
          entry: 'pending',
          sequence: 24,
          uid: 'nextuidb',
          date: date,
          amount: mani(7.35),
          balance: mani(84.9),
          payload: `/2021-01-28T00:00:00.000Z/from/ledger2/000000000024/nextuidb/to/ledger1/000000000013/nextuida/7,35 ɱ`

        }
      })
    })
  })
})
