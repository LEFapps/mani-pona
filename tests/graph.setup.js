import { ApolloServer, gql } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { DynamoPlus } from 'dynamo-plus'
import typeDefs from '../src/typeDefs'
import resolvers from '../src/resolvers'
import cognitoMock from './cognito.mock'
import log from 'loglevel'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

const SAY_HELLO = gql`
  {
    hello
  }
`

// Registration mutation:
const REGISTER = gql`
  mutation ($registration: LedgerRegistration!, $transaction: InitialTransaction!) {
    register(registration: $registration, transaction: $transaction) {
      ledger
      alias
    }
  }
`
// Challenge query:
const CHALLENGE = gql`
  {
    challenge
  }
`
const server = new ApolloServer({
  debug: true,
  typeDefs,
  resolvers,
  context: async () => {
    return {
      db: DynamoPlus({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      }),
      ...cognitoMock.context()
    }
  }
})

const { query, mutate } = createTestClient(server)
// wrap the regular query in something smarter, only for queries that are
// not supposed to fail
const testQuery = async (args) => {
  const results = await query(args)
  if (results.errors) {
    log.error(JSON.stringify(results.errors, 2))
  }
  return results
}

export { SAY_HELLO, REGISTER, CHALLENGE, server, query, mutate, testQuery }
