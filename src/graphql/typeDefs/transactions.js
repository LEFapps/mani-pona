import { gql } from 'apollo-server-lambda'

export default gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    "The amount to transfer. Note that a negative amount means it will be decrease the balance on this ledger ('outgoing'), a positive amount is 'incoming'"
    amount: Currency!
    "The ledger balance after the transfer"
    balance: Currency!
    "The date when this transfer was initiated"
    date: DateTime!
    "If the transaction was based on a jubilee, this show the proportion due to income."
    income: Currency
    "If the transaction was based on a jubilee, this show the proportion due to demurrage."
    demurrage: Currency
    "A unique representation of transaction used to create signatures"
    challenge: String
    "An (optional) message that was added to the transaction"
    message: String
    "Set to true if the ledger still needs to sign. (The destination may or may not have already provided a counter-signature.)"
    toSign: Boolean
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
    create(proof: Proof!, message: String): String
    "Confirm pending transaction"
    confirm(proof: Proof!): String
    "Cancel the currently pending transaction, matching this challenge."
    cancel(challenge: String!): String!
    "Export the transactions on this ledger"
    export(): String
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`
