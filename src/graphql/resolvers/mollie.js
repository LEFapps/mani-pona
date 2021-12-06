import { ForbiddenError } from 'apollo-server'
import { isEmpty, shuffle } from 'lodash'
import { getLogger } from 'server-log'
const log = getLogger('graphql:mollie')

export default {
  Mutation: {
    mollie: (_, { id }, { core, origin }) => {
      log.info('ORIGIN (resolver) %s %j', origin)
      return core.mollie(origin)
    }
  },
  MollieQuery: {
    startPayment: (mollie, { amount, ledger: id }, { core, ledger, admin }) => {
      if (id !== ledger && !admin) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return mollie.startPayment(amount, ledger)
    }
  }
}
