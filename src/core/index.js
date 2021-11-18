import System from './system'
import Transactions from './transactions'
import Mollie from './mollie'
import Table from '../dynamodb/table'
import { mani as maniLedgers } from './ledgers'

export default function (db, userpool) {
  const table = Table(db)
  const ledgers = maniLedgers(table)
  return {
    system: () => System(ledgers, userpool),
    mani: (fingerprint) => Transactions(ledgers, fingerprint),
    mollie: (origin) => Mollie(ledgers, origin)
  }
}
