import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from './scalars/currency'
import { SystemResolvers } from './system/resolvers'
import Transactions from './transactions/resolvers'

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
  Transactions
)

export default IndexResolvers
