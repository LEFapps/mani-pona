import { ForbiddenError } from 'apollo-server'
import { isEmpty } from 'lodash'
import log from 'loglevel'
import { wrap } from '../util'

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
    'recent': wrap(async (transactions, arg) => {
      return transactions.recent()
    }),
    'challenge': wrap(async (transactions, { destination, amount }) => {
      return transactions.challenge(destination, amount)
    }),
    'create': wrap(async (transactions, { proof }) => {
      return transactions.create(proof)
    }),
    'confirm': wrap(async (transactions, { proof }) => {
      return transactions.confirm(proof)
    }),
    'cancel': wrap(async (transactions, { challenge }) => {
      return transactions.cancel(challenge)
    })
  }
}

export { TransactionResolvers }
