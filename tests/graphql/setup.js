import AWS from 'aws-sdk'
import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { DynamoPlus } from 'dynamo-plus'
import { createGenerator } from '@faykah/core'
import { firstNames } from '@faykah/first-names-en'
import { lastNames } from '@faykah/last-names-en'
import { IndexDynamo } from '../../src/dynamodb/'
import typeDefs from '../../src/graphql/typeDefs'
import resolvers from '../../src/graphql/resolvers'
import { CognitoUserPool } from '../../src/cognito/userpool'
import { ManiClient } from '../shared'
import cognitoMock from './cognito.mock'
import log from 'loglevel'

// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
const textEncoding = require('text-encoding-utf-8')
global.TextEncoder = textEncoding.TextEncoder
global.TextDecoder = textEncoding.TextDecoder

// We can mock AWS methods, but still need to suppy a 'dummy' region
AWS.config.region = 'eu-west-1'

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
      userpool: CognitoUserPool('mock-pool'),
      ...cognitoMock.context()
    }
  }
})

const testClient = createTestClient(server)
const { query, mutate } = testClient

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

const generateFirstName = createGenerator(firstNames)
const generateLastName = createGenerator(lastNames)
// make a random name
const generateAlias = () => {
  return `${generateFirstName()} ${generateLastName()}`
}

const MemoryKeyStorage = () => {
  let keys
  return {
    getKeys: () => keys,
    saveKeys: (newKeys) => {
      keys = newKeys
    }
  }
}

const TestManiClient = async () => {
  let keyStore = MemoryKeyStorage()
  return ManiClient({ graphqlClient: testClient, keyStore })
}

export { server, query, mutate, testQuery, testMutate, cognitoMock, generateAlias, testClient, TestManiClient, MemoryKeyStorage }
