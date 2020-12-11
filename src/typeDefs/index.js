import { gql } from 'apollo-server-lambda'

export default gql`
  type Ledger {
    "The unique id of the ledger, the fingerprint of its public key."
    ledger: String!
    "The (armored) public key of this ledger"
    publicKey: String
    "A user readable alias for this ledger."
    alias: String
  }

  input LedgerInput {
    "The public key used to create the ledger."
    publicKey: String!
    "A publically available alias of this ledger."
    alias: String
  }
  
  type Query {
    "An example hello"
    hello: String
    "Text to be signed by client to verify key ownership"
    challenge: String!
    "Find the public key corresponding to this (fingerprint) id"
    findkey(id: String!): Ledger!
  }

  type Mutation {
    "Takes a public key and returns its ledger id"
    register(ledger: LedgerInput!, proof: String!): Ledger
  }
`
