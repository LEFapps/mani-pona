import { MANI } from '..'

describe('currency formatting', () => {
  it('should add the correct currency symbol and formatting', () => {
    expect(MANI(123.45).format()).toBe('123,45 ɱ')
  })

  it('should round to the nearest 0,05 ɱ', () => {
    expect(MANI(1.99).format()).toBe('2,00 ɱ')
    expect(MANI(1.94).format()).toBe('1,95 ɱ')
  })
})
