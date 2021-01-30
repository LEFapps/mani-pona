import table from './table'
import system from './system'
import transactions from './transactions'

const ledgers = (db, tableName) => {
  const T = table(db, tableName)
  return {
    system: system(T),
    transactions: (ledger) => transactions(T, ledger),
    register: async (registration) => {
      await T.putItem({
        ...registration,
        entry: 'pk'
      })
      return registration.ledger
    },
    findkey: async (ledger) => {
      return T.getItem({ ledger, entry: 'pk' })
    }
  }
}

export default ledgers
