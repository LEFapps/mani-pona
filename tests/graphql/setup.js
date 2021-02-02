import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { DynamoPlus } from 'dynamo-plus'
import { IndexDynamo } from '../../src/dynamodb/'
import typeDefs from '../../src/graphql/typeDefs'
import resolvers from '../../src/graphql/resolvers'
import userpool from '../../src/cognito/userpool'
import cognitoMock from './cognito.mock'
import log from 'loglevel'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

const server = new ApolloServer({
  debug: true,
  typeDefs,
  resolvers,
  context: async () => {
    return {
      indexDynamo: IndexDynamo(
        DynamoPlus({
          region: 'localhost',
          endpoint: 'http://localhost:8000'
        }),
        'manipona'
      ),
      userpool: userpool('mock-pool'),
      ...cognitoMock.context()
    }
  }
})

const { query, mutate } = createTestClient(server)

// wrap the regular query and mutate in something smarter, only for queries that are
// not supposed to fail
const wrap = (fn) => {
  return async (args) => {
    const results = await fn(args)
    if (results.errors) {
      log.error(JSON.stringify(results.errors, null, 2))
    }
    return results
  }
}

const testQuery = wrap(query)

const testMutate = wrap(mutate)

export { server, query, mutate, testQuery, testMutate, cognitoMock }
