import { ApolloClient, InMemoryCache } from '@apollo/client'
import config from '../sls-output.json'

const testing = process.env.REACT_APP_TEST
const ServiceEndpoint = config.ServiceEndpoint || 'http://localhost:3000'

const apolloClient = new ApolloClient({
  uri: ServiceEndpoint + '/graphql',
  // TODO: Cognito Auth
  request: async operation => {
    const headers = {
      authorization: (await Auth.currentSession()).getIdToken().getJwtToken()
    }
    if (testing) headers.user = (await Auth.currentAuthenticatedUser()).username
    operation.setContext({ headers })
  },
  cache: new InMemoryCache()
})

export default apolloClient
