import { gql } from 'apollo-server-lambda'

export default gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    amount: Currency
    balance: Currency!
    date: DateTime!
  }
  
  type LedgerQuery {
    transactions: TransactionQuery
    # to add: notifications, issuedBuffers, standingOrders, contacts, demurageHistory
  }

  type TransactionQuery {
    "Current transaction aka the current balance of the ledger"
    current: Transaction
    "Pending transaction (note: use the signing interface to sign, not this informative entry)"
    pending: Transaction
    "Most recent transactions"
    recent: [Transaction]
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`
