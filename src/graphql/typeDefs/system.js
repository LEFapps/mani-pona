import { gql } from 'apollo-server-lambda'

const SystemSchema = gql`
  type SystemParameters {
    "The (monthly) (basic) income"
    income: Currency!
    "(monthly) demurrage in percentage (so 5.0 would be a 5% demurrage)"
    demurrage: NonNegativeFloat!
  }

  type Ledger {
    "The unique id of the ledger, the fingerprint of its public key."
    ledger: String!
    "The (armored) public key of this ledger"
    publicKeyArmored: String
    "A user readable alias for this ledger."
    alias: String
  }

  input LedgerRegistration {
    "The public key used to create the ledger."
    publicKeyArmored: String!
    "Payload that was signed as a challenge"
    payload: String!
    "Signature of the payload by the private key corresponding to this public key"
    signature: String!
    "Signature of the 'flipped' payload (the transaction opposite to the payload)"
    counterSignature: String!
    "A publically available alias of this ledger."
    alias: String
  }

  type Jubilee {
    "Number of ledgers process in this batch"
    ledgers: Int!
    "Demurrage removed in this batch"
    demurrage: Currency!
    "Income added in this batch"
    income: Currency!
    "If the process is not finished yet (more batches available), it returns a paginationToken"
    nextToken: String
  }

  type User {
    alias: String
    sub: String
    email: String
    email_verified: StringBoolean
    administrator: StringBoolean
    status: String
    enabled: Boolean
    created: DateTime
    lastModified: DateTime
    ledger: String
    type: String
    requestedType: String
    privacy: String
    address: String
    zip: String
    city: String
    phone: String
    birthday: String
    companyTaxNumber: String
  }

  type AccountType {
    type: String!
    income: Currency!
    buffer: Currency!
    demurrage: Float!
  }

  type System {
    "The current income and demurrage settings, returns nothing when system hasn't been initialized yet"
    parameters: SystemParameters
    "Text to be signed by client to verify key ownership"
    challenge: String!
    "Find the public key corresponding to this (fingerprint) id"
    findkey(id: String!): Ledger
    "Register a new ledger, returns the id (fingerprint)"
    register(registration: LedgerRegistration!): String
    "Find a user by username (email address)"
    finduser(username: String!): User
    "Show the available account types"
    accountTypes: [AccountType]!
  }

  type Admin {
    "apply demurrage and (basic) income to all accounts"
    jubilee(paginationToken: String): Jubilee!
    "Initialize the system"
    init: String
    "Change the type of the account associated with this username (email address)"
    changeAccountType(username: String, type: String): String
    "Disable user account"
    disableAccount(username: String): String
    "Enable user account"
    enableAccount(username: String): String
    "Force a system payment"
    forceSystemPayment(ledger: String!, amount: Currency!): String
    "Export ledgers, outputs a CSV formatted string"
    exportLedgers: String
    "Create prepaid account with the supplied amount, return ledger id"
    createPrepaidLedger(amount: Currency!): String!
  }

  type Query {
    # access to system internals
    system: System!
  }

  type Mutation {
    admin: Admin
  }
`

export default SystemSchema
