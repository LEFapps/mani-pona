import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

export default new GraphQLScalarType({
  name: 'StringBoolean',
  description: 'Custom scalar type for working consistently with booleans that are represented by strings internally',
  // value sent to the client
  serialize (value) {
    return value === 'true'
  },
  // value from the client
  parseValue (value) {
    return `${value}`
  },
  // value from client in AST representation
  parseLiteral (ast) {
    if (ast.kind !== Kind.BOOLEAN) {
      throw new TypeError(
        `Unknown representation of boolean ${'value' in ast && ast.value}`
      )
    }
    return `${ast.value}`
  }
})
