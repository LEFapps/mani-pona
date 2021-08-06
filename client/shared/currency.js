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
    return new Mani(this.m.add(wrap(value).m))
  }

  subtract (value) {
    return new Mani(this.m.subtract(wrap(value).m))
  }

  multiply (value) {
    return new Mani(this.m.multiply(value))
  }

  divide (value) {
    return new Mani(this.m.divide(value))
  }

  distribute (value) {
    return new Mani(this.m.distribute(value))
  }

  positive () {
    return this.m.value > 0
  }

  negative () {
    return this.m.value < 0
  }

  format () {
    return this.m.format()
  }

  equals (value) {
    return this.intValue === wrap(value).intValue
  }

  clone () {
    return new Mani(this.value)
  }

  toString () {
    return this.m.format()
  }
}

const mani = value => new Mani(value)

// convert mani values to formatted strings
const convertMani = input => {
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
export default mani
