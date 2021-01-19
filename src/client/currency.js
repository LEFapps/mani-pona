import currency from 'currency.js'

const options = { symbol: 'ɱ', decimal: ',', separator: '.', increment: 0.05, errorOnInvalid: true, pattern: '# !', negativePattern: '-# !' }

/**
 * Currency definition, as a factory function. See [Currency.js](https://currency.js.org/).
 */
export default value => currency(value, options)
