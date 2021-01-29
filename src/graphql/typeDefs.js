import { gql } from 'apollo-server-lambda'
import { mergeTypeDefs } from '@graphql-tools/merge'
import system from './system/typeDefs'
import registration from './registration/typeDefs'

const schema = gql`
  scalar DateTime
  scalar NonNegativeFloat
  scalar Currency`

export default mergeTypeDefs([schema, system, registration])
