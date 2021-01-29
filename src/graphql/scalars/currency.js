import { GraphQLScalarType } from 'graphql'
import { mani, Mani } from '../../mani'
import { Kind } from 'graphql/language'

const currency = new GraphQLScalarType({
  name: 'Currency',
  description: 'Custom scalar type for working consistently with currency-style fractions',
  // value sent to the client
  serialize (value) {
    if (value instanceof Mani) {
      return value.format()
    } else {
      // note that this is quite permissive and will even allow something like "MANI 10 00,5" as input
      return mani(value).format()
    }
  },
  // value from the client
  parseValue (value) {
    return mani(value)
  },
  // value from client in AST representation
  parseLiteral (ast) {
    if (ast.kind !== Kind.STRING || ast.kind !== Kind.INT || ast.kind !== Kind.FLOAT) {
      throw new TypeError(
        `Unknown representation of currency ${'value' in ast && ast.value}`
      )
    }
    return mani(ast.value)
  }
})

export default currency
