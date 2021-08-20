import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from '../scalars/currency'
import { SystemResolvers } from './system'
import { TransactionResolvers } from './transactions'

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
