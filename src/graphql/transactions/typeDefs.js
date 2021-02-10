import { gql } from 'apollo-server-lambda'

export default gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    amount: Currency!
    balance: Currency!
    date: DateTime!
    income: Currency
    demurrage: Currency
    challenge: String
  }
  
  type LedgerQuery {
    transactions: TransactionQuery
    # to add: notifications, issuedBuffers, standingOrders, contacts, demurageHistory
  }
  
  input Proof {
    payload: String!
    "Signature of the payload by the private key corresponding to this public key"
    signature: String!
    "Signature of the 'flipped' payload (the transaction opposite to the payload)"
    counterSignature: String! 
  }

  type TransactionQuery {
    "Current transaction aka the current balance of the ledger"
    current: Transaction
    "Pending transaction (note: use the signing interface to sign, not this informative entry)"
    pending: Transaction
    "Most recent transactions"
    recent: [Transaction]
    "Provide transaction challenge with supplied destination and amount"
    challenge(destination: String, amount: Currency): String
    "Create (pending) transaction"
    create(proof: Proof!): String
    "Confirm pending transaction"
    confirm(proof: Proof!): String
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`
