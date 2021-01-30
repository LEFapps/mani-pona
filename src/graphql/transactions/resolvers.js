import { ForbiddenError } from 'apollo-server'
import log from 'loglevel'
import { wrap } from '../util'

const transactions = {
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
    'current': async (id, arg, { ledgers }) => {
      return ledgers.transactions(id).current()
    },
    'pending': async (id, arg, { ledgers }) => {
      return ledgers.transactions(id).pending()
    },
    'recent': wrap(async (id, arg, { ledgers }) => {
      return ledgers.transactions(id).recent()
    })
  }
}

export default transactions
