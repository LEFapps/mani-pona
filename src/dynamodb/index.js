import table from './table'
import system from './system'
import transactions from './transactions'
import verification from '../core/verification'

const IndexDynamo = (db, tableName) => {
  const T = table(db, tableName)
  const verify = verification(T)
  return {
    system: system(T),
    transactions: (ledger) => transactions(T, ledger, verify),
    findkey: async (ledger) => {
      return T.attributes(['publicKeyArmored']).getItem({ ledger, entry: 'pk' })
    }
  }
}

export { IndexDynamo }
