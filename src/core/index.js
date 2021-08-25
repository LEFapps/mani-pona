import System from './system'
import Transactions from './transactions'
import Table from '../dynamodb/table'

export default function (db, userpool) {
  const tableName = process.env.DYN_TABLE
  const table = Table(db, tableName)
  return {
    system: () => System(table, userpool),
    mani: (fingerprint) => Transactions(table, fingerprint, '')
  }
}
