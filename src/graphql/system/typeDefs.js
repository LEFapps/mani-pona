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
    ledgers: Int
    demurrage: Currency!
    income: Currency!
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
  }

  type Admin {
    # apply demurrage and (basic) income to all accounts
    jubilee: Jubilee!
    # initialize the system
    init: String
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
