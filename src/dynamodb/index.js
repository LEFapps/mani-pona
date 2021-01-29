import table from './table'
import system from './system'

const ledgers = (db, tableName) => {
  const ledgerTable = table(db, tableName)
  return {
    system: system(ledgerTable),
    register: async (registration) => {
      await ledgerTable.putItem({
        ...registration,
        entry: 'pk'
      })
      return registration.ledger
    },
    findkey: async (ledger) => {
      return ledgerTable.getItem({ ledger, entry: 'pk' })
    }
  }
}

export default ledgers
