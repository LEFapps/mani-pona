import { makeExecutableSchema } from 'graphql-tools'
import root from './typeDefs/root'

export default makeExecutableSchema({
  typeDefs: [
    root
  ],
  resolvers: {
    Query: {
      hello: () => 'Hello world!'
    }
  }
})
