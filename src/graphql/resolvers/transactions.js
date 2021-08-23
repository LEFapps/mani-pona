import { ForbiddenError } from 'apollo-server'
import { isEmpty } from 'lodash'
import { getLogger } from 'server-log'
const log = getLogger('graphql:transactions')

const TransactionResolvers = {
  Query: {
    ledger: (_, { id }) => {
      return id // optional: check if this even exists?
    }
  },
  'LedgerQuery': {
    'transactions': (id, arg, { indexDynamo, ledger, verified }) => {
      if (id !== ledger) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return indexDynamo.transactions(id)
    }
  },
  'TransactionQuery': {
    'current': async (transactions, arg) => {
      return transactions.current()
    },
    'pending': async (transactions, arg) => {
      const pending = await transactions.pending()
      if (pending) {
        return {
          ...pending,
          message: 'Pending',
          toSign: isEmpty(pending.signature)
        }
      }
    },
    'recent': async (transactions, arg) => {
      log.debug('recent transactions requested for %j', arg)
      return transactions.recent()
    },
    'challenge': async (transactions, { destination, amount }) => {
      return transactions.challenge(destination, amount)
    },
    'create': async (transactions, { proof }) => {
      return transactions.create(proof)
    },
    'confirm': async (transactions, { proof }) => {
      return transactions.confirm(proof)
    },
    'cancel': async (transactions, { challenge }) => {
      return transactions.cancel(challenge)
    }
  }
}

export { TransactionResolvers }
