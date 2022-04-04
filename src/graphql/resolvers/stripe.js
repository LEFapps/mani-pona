import { ForbiddenError } from 'apollo-server'
import { isEmpty, shuffle } from 'lodash'
import { getLogger } from 'server-log'
const log = getLogger('graphql:stripe')

export default {
  Mutation: {
    stripe: (_, { id }, { core, origin }) => {
      log.info('ORIGIN (resolver) %s %j', origin)
      return core.stripe(origin)
    }
  },
  StripeQuery: {
    startPayment: (stripe, { amount, ledger: id }, { core, ledger, admin }) => {
      if (id !== ledger && !admin) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return stripe.startPayment(amount, ledger)
    }
  }
}
