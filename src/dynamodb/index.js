import table from './table'
import system from './system'
import transactions from './transactions'
import verification from '../core/verification'
import { getLogger } from 'server-log'
const log = getLogger('dynamodb:index')

const IndexDynamo = (db, tableName) => {
  const T = table(db, tableName)
  const verify = verification(T)
  return {
    table: T,
    system: system(T),
    transactions: (ledger) => {
      log.warn(`Deprecated, please use ledgers.mani(account) instead`)
      try {
        return transactions(T, ledger, verify)
      } catch (e) {
        log.error(e)
      }
    },
    ledgers: {
      mani: (account) => transactions(T, `/${account}/mani`, verify),
      telo: (account) => transactions(T, `/${account}/telo`, verify)
    },
    findkey: async (ledger) => {
      return T.attributes(['ledger', 'publicKeyArmored', 'alias']).getItem({ ledger, entry: 'pk' })
    }
  }
}

export { IndexDynamo }
