import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from '../scalars/currency'
import system from './system'
import transactions from './transactions'

export default merge(
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
  system,
  transactions
)
