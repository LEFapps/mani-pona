import { ForbiddenError } from 'apollo-server'
import { isEmpty, shuffle } from 'lodash'
import { getLogger } from 'server-log'
const log = getLogger('graphql:transactions')

export default {
  Query: {
    ledger: (_, { id }) => {
      return id // optional: check if this even exists?
    }
  },
  LedgerQuery: {
    transactions: (id, arg, { core, ledger, admin }) => {
      if (id !== ledger && !admin) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return core.mani(id)
    },
    notifications: (id, _args, { core }) => {
      // TODO: remove 'notify' attribute upon retrieval
      return core.mani(id).notifications()
    }
  },
  TransactionQuery: {
    available: async transactions => {
      return transactions.available()
    },
    current: async transactions => {
      return transactions.short().current()
    },
    pending: async transactions => {
      const pending = await transactions.pending()
      if (pending) {
        return {
          message: 'Pending',
          ...pending,
          toSign: isEmpty(pending.signature)
        }
      }
    },
    recent: async transactions => {
      log.debug(
        'recent transactions requested for %s',
        transactions.fingerprint
      )
      return transactions.short().recent()
    },
    challenge: async (transactions, { destination, amount }) => {
      return transactions.challenge(destination, amount)
    },
    create: async (transactions, { proof, message, prepaid }) => {
      return transactions.create(proof, message, prepaid)
    },
    confirm: async (transactions, { proof }) => {
      return transactions.confirm(proof)
    },
    cancel: async (transactions, { challenge }) => {
      return transactions.cancel(challenge)
    }
  }
}
