import { DateTimeResolver, NonNegativeFloatResolver } from 'graphql-scalars'
import { merge } from 'lodash'
import Currency from '../scalars/currency'
import StringBoolean from '../scalars/StringBoolean'
import system from './system'
import transactions from './transactions'
import mollie from './mollie'

export default merge(
  {
    DateTime: DateTimeResolver,
    NonNegativeFloat: NonNegativeFloatResolver
  },
  { Currency, StringBoolean },
  {
    Query: {
      time: () => new Date(Date.now())
    }
  },
  system,
  transactions,
  mollie
)
