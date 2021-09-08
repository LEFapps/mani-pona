import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Auth } from 'aws-amplify'
import config from '../sls-output.json'

const testing = process.env.REACT_APP_TEST
const ServiceEndpoint = config.ServiceEndpoint || 'http://localhost:3000'

const AuthLink = setContext(async (_, { headers }) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: (await Auth.currentSession()).getIdToken().getJwtToken()
    }
  }
})

const enchancedFetch = async (url, init) => {
  const token = (await Auth.currentSession()).getIdToken().getJwtToken()
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      'access-control-allow-origin': '*',
      authorization: token
    }
  }).then(response => response)
}

const apolloClient = new ApolloClient({
  link: createHttpLink({
    uri: ServiceEndpoint + '/graphql',
    fetch: enchancedFetch
  }),
  // link: createHttpLink({
  //   uri: ServiceEndpoint + '/graphql',
  //   credentials: 'include',
  //   fetchOptions: {
  //     mode: 'cors'
  //   },
  //   fetch: enchancedFetch
  // }),

  // DEPRECATED: Cognito Auth
  // headers: async operation => {
  //   const headers = {
  //     authorization: (await Auth.currentSession()).getIdToken().getJwtToken()
  //   }
  //   console.log('HEADERS', headers)
  //   if (testing) headers.user = (await Auth.currentAuthenticatedUser()).username
  //   operation.setContext({ headers })
  // },
  cache: new InMemoryCache(),
  connectToDevTools: true
})

export default apolloClient
