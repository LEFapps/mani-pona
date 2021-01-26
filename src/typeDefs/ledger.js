import { gql } from 'apollo-server-lambda'

export default gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    amount: Currency
    previous: String
    balance: Currency!
    date: DateTime!
    "Proposed chain id"
    proof: String!
  }
  
  type LedgerQuery {
    transactions: TransactionQuery
    # to add: notifications, issuedBuffers, standingOrders, contacts, demurageHistory
  }

  type TransactionQuery {
    "Most recent transactions"
    all: [Transaction]
    "Pending transaction"
    pending: Transaction
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`
