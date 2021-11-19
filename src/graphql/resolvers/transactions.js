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
    notifications: (_vars, _args, _context) => {
      const notifications = [
        {
          title: 'Hello World',
          message: 'This is a sample notification',
          type: 'info'
        },
        {
          title: 'Oopsie Daisy',
          message: 'This is not so good, is it?',
          type: 'warning'
        },
        {
          title: 'Really bad eggs',
          message: 'Run for you life while you still can!',
          type: 'danger'
        },
        {
          title: 'Hip hoi',
          message: 'Ik heb een tante in marokko en die komt!',
          type: 'success'
        },
        {
          title: 'Nieuwe betaling',
          message: 'Je hebt een nieuwe betalingsaanvraag.',
          type: 'info',
          redirect: 'pending'
        }
      ]
      // TODO:
      // - list records from ledger with 'aknowledged: false'
      // - set 'aknowledged: true'
      // - determine type, based on entry key ???
      return shuffle(notifications).slice(0, Math.floor(Math.random() * 3))
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
