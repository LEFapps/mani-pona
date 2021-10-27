import { describe, expect, it } from '@jest/globals'
import { toCSV } from '../src/core/util'

describe('Export to CSV', () => {
  it('should produce a concatenated CSV', () => {
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
})
