import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from './scalars/currency'
import System from './system/resolvers'
import Registration from './registration/resolvers'

const resolvers = merge(
  {
    DateTime: DateTimeResolver,
    NonNegativeFloat: NonNegativeFloatResolver
  },
  { Currency },
  {
    Query: {
      challenge: () => 'This is my key, verify me' // TODO: randomly rotate?
    }
  },
  System,
  Registration
)

export default resolvers
