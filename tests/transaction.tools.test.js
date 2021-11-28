import { describe, expect, it } from '@jest/globals'
import {
  pad,
  other,
  toDb,
  fromDb,
  destructure,
  destructurePath,
  challenge,
  toEntry,
  flip
} from '../client/shared/tools'
import { mani } from 'shared'

describe('Transaction tools', () => {
  it('should pad numbers', () => {
    expect(pad(123)).toEqual('000000000123')
  })
  it('should know the other party', () => {
    expect(other('ledger')).toEqual('destination')
    expect(other('destination')).toEqual('ledger')
  })

  it('should convert Date and Mani to the db', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    expect(
      toDb({
        date: new Date(dateISO),
        amount: mani(1),
        balance: mani(2.33),
        income: mani(3)
      })
    ).toEqual({
      date: dateISO,
      amount: '1,00 ɱ',
      balance: '2,35 ɱ',
      income: '3,00 ɱ'
    })
  })

  it('should convert Date and Mani from the db', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    expect(
      fromDb({
        date: dateISO,
        amount: '1,00 ɱ',
        balance: '2,35 ɱ',
        income: '3,00 ɱ'
      })
    ).toEqual({
      date: new Date(dateISO),
      amount: mani(1),
      balance: mani(2.35),
      income: mani(3)
    })
    expect(fromDb([{ balance: '1,00 ɱ' }, { income: '2,00 ɱ' }])).toEqual([
      { balance: mani(1) },
      { income: mani(2) }
    ])
  })

  it('should destructure payloads', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    const date = new Date(dateISO)
    expect(destructurePath(`/ledger1/000000000013/nextuida`)).toEqual({
      ledger: 'ledger1',
      sequence: 13,
      uid: 'nextuida'
    })
    expect(
      destructure(
        `/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/-10.758,35 ɱ`
      )
    ).toEqual({
      date,
      from: {
        ledger: 'ledger1',
        sequence: 13,
        uid: 'nextuida'
      },
      to: {
        ledger: 'ledger2',
        sequence: 24,
        uid: 'nextuidb'
      },
      amount: mani(-10758.35)
    })
    expect(
      destructure(
        `/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/5,43 ɱ`
      )
    ).toEqual({
      date,
      from: {
        ledger: 'ledger1',
        sequence: 13,
        uid: 'nextuida'
      },
      to: {
        ledger: 'ledger2',
        sequence: 24,
        uid: 'nextuidb'
      },
      amount: mani(5.43)
    })
  })

  it('should convert payloads to entries', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    const date = new Date(dateISO)
    const payload =
      '/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/-7,35 ɱ'
    expect(toEntry(payload)).toEqual({
      date,
      ledger: 'ledger1',
      entry: 'pending',
      sequence: 13,
      uid: 'nextuida',
      destination: 'ledger2',
      payload,
      amount: mani(-7.35)
    })
    expect(toEntry(payload, true)).toEqual({
      date,
      ledger: 'ledger2',
      entry: 'pending',
      sequence: 24,
      uid: 'nextuidb',
      destination: 'ledger1',
      payload:
        '/2021-01-28T00:00:00.000Z/from/ledger2/000000000024/nextuidb/to/ledger1/000000000013/nextuida/7,35 ɱ',
      amount: mani(7.35)
    })
  })

  it('should flip payloads', () => {
    expect(
      flip(
        '/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/-7,35 ɱ'
      )
    ).toEqual(
      '/2021-01-28T00:00:00.000Z/from/ledger2/000000000024/nextuidb/to/ledger1/000000000013/nextuida/7,35 ɱ'
    )
  })

  it('should produce a challenge', () => {
    const dateISO = '2021-01-28T00:00:00.000Z'
    const date = new Date(dateISO)
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
    expect(challenge({ date, source, target, amount: mani(-7.35) })).toEqual(
      `/2021-01-28T00:00:00.000Z/from/ledger1/000000000013/nextuida/to/ledger2/000000000024/nextuidb/-7,35 ɱ`
    )
  })
})
