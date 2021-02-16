import { ApolloServer } from 'apollo-server-lambda'
import { DynamoPlus } from 'dynamo-plus'
import log from 'loglevel'
import { IndexDynamo } from '../dynamodb/index'
import typeDefs from '../graphql/typeDefs'
import resolvers from '../graphql/resolvers'
import { CognitoUserPool } from '../cognito/userpool'
import { OfflineUserPool } from './offlineuserpool'

log.setLevel('info')

function contextProcessor (event) {
  const { headers } = event
  // fake the cognito interface if offline
  let claims = process.env.IS_OFFLINE ? JSON.parse(headers['x-claims']) : event.requestContext.authorizer.claims
  console.log(`User claims ${JSON.stringify(claims)}`)
  let userpool = process.env.IS_OFFLINE ? OfflineUserPool() : CognitoUserPool(process.env.USER_POOL)
  return {
    userpool,
    ledger: claims.sub,
    verified: claims.verified,
    admin: claims.admin
  }
}

const server = new ApolloServer({
  debug: process.env.DEBUG === 'true',
  typeDefs,
  resolvers,
  formatError: err => {
    console.error(err, err.stack)
    return err
  },
  context: async ({ event, context }) => {
    return {
      indexDynamo: IndexDynamo(
        DynamoPlus({
          region: process.env.DYN_REGION,
          endpoint: process.env.DYN_ENDPOINT
        }),
        process.env.DYN_TABLE
      ),
      ...contextProcessor(event)
    }
  }
})

export function graphqlHandler (event, context, callback) {
  server.createHandler({
    cors: {
      origin: '*',
      credentials: true
    }
  })(event, context, callback)
}
