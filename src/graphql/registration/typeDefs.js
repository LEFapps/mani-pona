import { gql } from 'apollo-server-lambda'

const schema = gql`
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
    "The challenge signed by the private key corresponding to this public key"
    proof: String!
    "A publically available alias of this ledger."
    alias: String
  }

  type Query {
    "Text to be signed by client to verify key ownership"
    challenge: String!
    "Find the public key corresponding to this (fingerprint) id"
    findkey(id: String!): Ledger!
  }

  type Mutation {
    "Register a new ledger, returns the id (fingerprint)"
    register(registration: LedgerRegistration!): String
  }
`

export default schema
