import { gql } from 'apollo-server-lambda'
import { mergeTypeDefs } from '@graphql-tools/merge'
import system from './system'
import transactions from './transactions'

const schema = gql`
  scalar DateTime
  scalar NonNegativeFloat
  scalar Currency
  
  type Query {
    time: DateTime!
  }
`

export default mergeTypeDefs([schema, system, transactions])
