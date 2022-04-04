import { ApolloServer } from 'apollo-server-lambda'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import { DynamoPlus } from 'dynamo-plus'
import http from 'http'
import Core from '../core/index'
import typeDefs from '../graphql/typeDefs/index'
import resolvers from '../graphql/resolvers/index'
import { CognitoUserPool } from '../cognito/userpool'
import { OfflineUserPool } from './offlineuserpool'
import { apolloLogPlugin, getLogger } from 'server-log'

const log = getLogger('lambda:handler')

const debug = process.env.DEBUG === 'true'
const offline = process.env.IS_OFFLINE === 'true'
const userpool = process.env.USER_POOL_ID || process.env.USER_POOL
const systemInit = process.env.AUTO_SYSTEM_INIT === 'true'

function contextProcessor (event) {
  const { headers } = event
  log.debug('Context Event: \n%j', event)
  // fake the cognito interface if offline
  let claims = offline
    ? JSON.parse(headers['x-claims'] || process.env.CLAIMS)
    : event.requestContext.authorizer.jwt.claims
  log.debug('User claims: %j', claims)
  return {
    ledger: claims['custom:ledger'],
    verified: claims.email_verified,
    admin: claims['custom:administrator'],
    username: claims.sub,
    claims,
    origin: headers['Origin']
  }
}

const offlineOptions = offline
  ? {
      endpoint: 'http://localhost:8000',
      httpOptions: { agent: new http.Agent({ keepAlive: true }) }
    }
  : {}

const core = Core(
  DynamoPlus({
    region: process.env.DYN_REGION,
    ...offlineOptions,
    maxRetries: 3
  }),
  userpool ? CognitoUserPool(userpool) : OfflineUserPool()
)

if (systemInit) {
  log.info('Automatically initializing system')
  core.system().init()
}

log.info('Starting ApolloServer (debug: %s, offline: %s)', debug, offline)
log.debug('ENV variables: %j', process.env)
const server = new ApolloServer({
  debug,
  introspection: debug,
  typeDefs,
  resolvers,
  plugins: [apolloLogPlugin, ApolloServerPluginLandingPageGraphQLPlayground()],
  cors: false,
  context: async ({ event, context }) => {
    return {
      core,
      ...contextProcessor(event)
    }
  }
})

const handler = server.createHandler()

async function debugHandler (event, context) {
  // log.debug('event: %j', event)
  // log.debug('context: %j', context)
  return handler(event, context)
}

exports.graphqlHandler = debug ? debugHandler : handler
