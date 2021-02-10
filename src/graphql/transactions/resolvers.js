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
    'transactions': (id, arg, { ledger, verified }) => {
      if (id !== ledger) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return id
    }
  },
  'TransactionQuery': {
    'current': async (id, arg, { indexDynamo }) => {
      return indexDynamo.transactions(id).current()
    },
    'pending': async (id, arg, { indexDynamo }) => {
      return indexDynamo.transactions(id).pending()
    },
    'recent': wrap(async (id, arg, { indexDynamo }) => {
      return indexDynamo.transactions(id).recent()
    }),
    'challenge': wrap(async (id, { destination, amount }, { indexDynamo }) => {
      return indexDynamo.transactions(id).challenge(destination, amount)
    }),
    'create': wrap(async (id, { proof }, { indexDynamo }) => {
      return indexDynamo.transactions(id).create(proof)
    }),
    'confirm': wrap(async (id, { proof }, { indexDynamo }) => {
      return indexDynamo.transactions(id).confirm(proof)
    })
  }
}

export { TransactionResolvers }
