import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { DynamoPlus } from 'dynamo-plus'
import typeDefs from '../src/typeDefs'
import resolvers from '../src/resolvers'
import cognitoMock from './cognito.mock'
import log from 'loglevel'

// Registration mutation:
const REGISTER = `
  mutation ($registration: LedgerRegistration!, $transaction: InitialTransaction!) {
    register(registration: $registration, transaction: $transaction) {
      ledger
      alias
    }
  }
`
// Challenge query:
const CHALLENGE = `
  {
    challenge
  }
`
console.log('Creating ApolloServer')
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

export { REGISTER, CHALLENGE, server, query, mutate, testQuery }
