import table from './table'
import system from './system'
import transactions from './transactions'
import verification from '../core/verification'

const IndexDynamo = (db, tableName) => {
  const T = table(db, tableName)
  const verify = verification(T)
  return {
    table: T,
    system: system(T),
    transactions: (ledger) => transactions(T, ledger, verify),
    findkey: async (ledger) => {
      return T.attributes(['ledger', 'publicKeyArmored', 'alias']).getItem({ ledger, entry: 'pk' })
    }
  }
}

export { IndexDynamo }
