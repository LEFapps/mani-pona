import { ApolloServer } from 'apollo-server-lambda'
import { DynamoPlus } from 'dynamo-plus'
import Core from '../core/index'
import typeDefs from '../graphql/typeDefs/index'
import resolvers from '../graphql/resolvers/index'
import { CognitoUserPool } from '../cognito/userpool'
import { OfflineUserPool } from './offlineuserpool'
import { apolloLogPlugin, getLogger } from 'server-log'

const log = getLogger('lambda:handler')

function contextProcessor (event) {
  const { headers } = event
  // fake the cognito interface if offline
  let claims = process.env.IS_OFFLINE
    ? JSON.parse(headers['x-claims'])
    : event.requestContext.authorizer.claims
  log.debug('User claims: %j', claims)
  return {
    ledger: claims['custom:ledger'],
    verified: claims.email_verified,
    admin: claims['custom:administrator']
  }
}

log.info(`Starting ApolloServer with DEBUG = ${process.env.DEBUG}`)
const server = new ApolloServer({
  debug: process.env.DEBUG === 'true',
  introspection: process.env.DEBUG === 'true',
  typeDefs,
  resolvers,
  plugins: [apolloLogPlugin],
  context: async ({ event, context }) => {
    return {
      core: Core(
        DynamoPlus({
          region: process.env.DYN_REGION,
          maxRetries: 3
        }),
        process.env.IS_OFFLINE
          ? OfflineUserPool()
          : CognitoUserPool(process.env.USER_POOL)
      ),
      ...contextProcessor(event)
    }
  }
})

exports.graphqlHandler = server.createHandler()
