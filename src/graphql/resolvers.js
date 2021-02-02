import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from './scalars/currency'
import { SystemResolvers } from './system/resolvers'
import { TransactionResolvers } from './transactions/resolvers'

const IndexResolvers = merge(
  {
    DateTime: DateTimeResolver,
    NonNegativeFloat: NonNegativeFloatResolver
  },
  { Currency },
  {
    Query: {
      time: () => new Date(Date.now())
    }
  },
  SystemResolvers,
  TransactionResolvers
)

export default IndexResolvers
