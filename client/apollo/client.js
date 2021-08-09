import { ApolloClient, InMemoryCache } from '@apollo/client'
import config from '../aws-config'

const testing = process.env.REACT_APP_TEST
config.ServiceEndpoint = config.ServiceEndpoint || 'http://localhost:3000'

const apolloClient = new ApolloClient({
  uri: config.ServiceEndpoint + '/graphql',
  // TODO: Cognito Auth
  // request: async operation => {
  //   const headers = {
  //     authorization: (await Auth.currentSession()).getIdToken().getJwtToken()
  //   }
  //   if (testing) headers.user = (await Auth.currentAuthenticatedUser()).username
  //   operation.setContext({ headers })
  // },
  cache: new InMemoryCache()
})

export default apolloClient
