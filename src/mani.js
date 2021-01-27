import _ from 'lodash'
import currency from 'currency.js'

const wrap = value => {
  if (value instanceof Mani) {
    return value
  } else {
    return new Mani(value)
  }
}

/**
 * Mani currency class. See [Currency.js](https://currency.js.org/).
 */
class Mani {
  constructor (value) {
    this.m = currency(value, {
      symbol: 'ɱ',
      decimal: ',',
      separator: '.',
      increment: 0.05,
      errorOnInvalid: true,
      pattern: '# !',
      negativePattern: '-# !'
    })
  }

  get value () {
    return this.m.value
  }

  get intValue () {
    return this.m.intValue
  }

  add (value) {
    this.m.add(wrap(value).m)
    return this
  }

  subtract (value) {
    this.m.subtract(wrap(value).m)
    return this
  }

  multiply (value) {
    this.m.multiply(wrap(value).m)
    return this
  }

  divide (value) {
    this.m.divide(wrap(value).m)
    return this
  }

  distribute (value) {
    this.m.distribute(wrap(value).m)
    return this
  }

  format () {
    return this.m.format()
  }

  equals (value) {
    return this.intValue === wrap(value).intValue
  }
}

const mani = value => new Mani(value)

// convert mani values to formatted strings
const convertMani = (input) => {
  if (_.isObject(input)) {
    const clone = _.clone(input)
    _.forEach(clone, (value, key) => {
      if (value instanceof Mani) {
        clone[key] = value.format()
      }
    })
    return clone
  }
}

export { mani, convertMani, Mani }
