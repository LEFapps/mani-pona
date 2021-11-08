import { describe, expect, it } from '@jest/globals'
import { mani, convertMani } from 'shared'

describe('currency formatting', () => {
  it('should add the correct currency symbol and formatting', () => {
    expect(mani(123.45).format()).toBe('123,45 ɱ')
  })

  it('should correctly parse a mani string representation', () => {
    expect(mani('12.345,67 ɱ')).toEqual(mani(12345.67))
    expect(mani('10.000,00 ɱ')).toEqual(mani(10000))
  })

  it('should be able to compare different entries', () => {
    expect(mani(0).equals(0)).toBe(true)
    expect(mani(0).equals(1)).toBe(false)
    expect(mani(1.5).equals(1.5)).toBe(true)
    expect(mani(3.33).equals(mani(3.33))).toBe(true)
  })

  it('clones should be equal', () => {
    expect(mani(5.5).clone()).toEqual(mani(5.5))
  })

  it('clones should multiply', () => {
    expect(mani(5.5).multiply(-1)).toEqual(mani(-5.5))
  })

  it('should round to the nearest 0,05 ɱ', () => {
    expect(mani(1.99).format()).toBe('2,00 ɱ')
    expect(mani(1.94).format()).toBe('1,95 ɱ')
  })

  it('should convert mani fields', () => {
    expect(convertMani({
      foo: 1,
      amount: mani(1.23)
    })).toEqual({
      foo: 1,
      amount: '1,25 ɱ'
    })
  })
})
