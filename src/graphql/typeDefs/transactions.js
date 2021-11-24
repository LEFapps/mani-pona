import { gql } from 'apollo-server-lambda'

export default gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    "The current position of this transaction in the ledger. Will be 'pending', '/current' or a timestamped entry (historical transaction)."
    entry: String
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

  "Balance is a representation of the (virtual) balance of a ledger at some point in time."
  type Balance {
    balance: Currency!
    date: DateTime!
    income: Currency!
    demurrage: Currency!
    "Added just for completeness, but keep in mind that the unit of this is manicent-milliseconds..."
    remainder: Int!
  }

  type Notification {
    value: String!
  }

  type LedgerQuery {
    transactions: TransactionQuery
    notifications: Notification
    # to add: issuedBuffers, standingOrders, contacts, demurageHistory
  }

  input Proof {
    payload: String!
    "Signature of the payload by the private key corresponding to this public key"
    signature: String!
    "Signature of the 'flipped' payload (the transaction opposite to the payload)"
    counterSignature: String!
  }

  type TransactionQuery {
    "The (virtual) balance of the ledger, should demurrage and income be calculated based on the current time."
    available: Balance!
    "Current transaction (last one that was completed) on the ledger"
    current: Transaction
    "Pending transaction (note: use the signing interface to sign, not this informative entry)"
    pending: Transaction
    "Most recent transactions"
    recent: [Transaction]
    "Provide transaction challenge with supplied destination and amount"
    challenge(destination: String, amount: Currency): String
    "Create transaction, with an optional message. If the destination is prepaid (autosigning), ."
    create(proof: Proof!, message: String, prepaid: Boolean): Transaction
    "Confirm pending transaction"
    confirm(proof: Proof!): String
    "Cancel the currently pending transaction, matching this challenge."
    cancel(challenge: String!): String!
    "Export the transactions on this ledger"
    export(id: String): String
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`
