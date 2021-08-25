import { ForbiddenError } from 'apollo-server'
import { isEmpty } from 'lodash'
import { getLogger } from 'server-log'
const log = getLogger('graphql:transactions')

export default {
  Query: {
    ledger: (_, { id }) => {
      return id // optional: check if this even exists?
    }
  },
  'LedgerQuery': {
    'transactions': (id, arg, { core, ledger }) => {
      if (id !== ledger) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return core.mani(id)
    }
  },
  'TransactionQuery': {
    'current': async (transactions) => {
      return transactions.short().current()
    },
    'pending': async (transactions) => {
      const pending = await transactions.pending()
      if (pending) {
        return {
          ...pending,
          message: 'Pending',
          toSign: isEmpty(pending.signature)
        }
      }
    },
    'recent': async (transactions) => {
      log.debug('recent transactions requested for %s', transactions.fingerprint)
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
