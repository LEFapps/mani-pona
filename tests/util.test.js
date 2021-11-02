import { describe, expect, it } from '@jest/globals'
import { toCSV } from '../src/core/util'
import { redeem } from '../client/shared/tools'
import { mani } from '../client/shared/mani'

describe('Tools', () => {
  it('should export a concatenated CSV', () => {
    const attributes = ['foo', 'bar']
    const items = [
      {
        foo: 'a',
        none: 'error'
      },
      { bar: 'b',
        foo: 'c'
      }
    ]
    const result = 'foo;bar\na;\nc;b'
    expect(toCSV(attributes, items)).toEqual(result)
  })

  it('should redeem (recalculate) balances correctly', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24)
    const lastMonth = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)

    // Nothing happens
    expect(redeem({
      balance: mani(0),
      date: yesterday,
      remainder: 0
    }, {
      income: mani(0),
      buffer: mani(0),
      demurrage: 0
    }, { now })).toEqual({
      balance: mani(0),
      date: now,
      remainder: 0,
      demurrageTaken: 0,
      incomeGranted: 0
    })
    // One month demurrage
    expect(redeem({
      balance: mani(100),
      date: lastMonth,
      remainder: 0
    }, {
      income: mani(0),
      buffer: mani(0),
      demurrage: 0.01
    }, { now })).toEqual({
      balance: mani(99.99),
      date: now,
      remainder: 0,
      demurrageTaken: 0.01,
      incomeGranted: 0
    })

    // Single day demurrage
    expect(redeem({
      balance: mani(3000),
      date: yesterday,
      remainder: 0
    }, {
      income: mani(0),
      buffer: mani(0),
      demurrage: 10.0
    }, { now })).toEqual({
      balance: mani(2990),
      date: now,
      remainder: 0,
      demurrageTaken: 10,
      incomeGranted: 0
    })
    // One month income and demurrage
    expect(redeem({
      balance: mani(200),
      date: lastMonth,
      remainder: 0
    }, {
      income: mani(5),
      buffer: mani(100),
      demurrage: 1.0
    }, { now })).toEqual({
      balance: mani(204),
      date: now,
      remainder: 0,
      demurrageTaken: 1,
      incomeGranted: 5
    })
    // fractional income
    let transaction = {
      balance: mani(1.5),
      date: lastMonth,
      remainder: 0
    }
    const parameters = {
      income: mani(1),
      buffer: mani(0),
      demurrage: 0
    }
    for (let day = 1; day <= 30; day++) {
      const nextDate = new Date(transaction.date.getTime() + 24 * 60 * 60 * 1000)
      transaction = redeem(transaction, parameters, { now: nextDate })
    }
    expect(transaction).toEqual({
      balance: mani(2.5),
      date: now,
      remainder: 0,
      demurrageTaken: 0,
      incomeGranted: 0.04
    })
  })
})
