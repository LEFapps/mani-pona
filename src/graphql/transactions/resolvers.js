import { ForbiddenError } from 'apollo-server'
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
    'current': async (tr, arg, { indexDynamo }) => {
      return tr.current()
    },
    'pending': async (tr, arg, { indexDynamo }) => {
      return tr.pending()
    },
    'recent': wrap(async (tr, arg, { indexDynamo }) => {
      return tr.recent()
    }),
    'challenge': wrap(async (tr, { destination, amount }, { indexDynamo }) => {
      return tr.challenge(destination, amount)
    }),
    'create': wrap(async (tr, { proof }, { indexDynamo }) => {
      return tr.create(proof)
    }),
    'confirm': wrap(async (tr, { proof }, { indexDynamo }) => {
      return tr.confirm(proof)
    })
  }
}

export { TransactionResolvers }
