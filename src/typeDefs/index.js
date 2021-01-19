import { gql } from 'apollo-server-lambda'
import { DateTime } from 'graphql-scalars'

export default gql`
  scalar DateTime

  scalar Currency 

  type Ledger {
    "The unique id of the ledger, the fingerprint of its public key."
    ledger: String!
    "The (armored) public key of this ledger"
    publicKey: String
    "A user readable alias for this ledger."
    alias: String
  }

  input LedgerRegistration {
    "The public key used to create the ledger."
    publicKey: String!
    "The challenge signed by the private key corresponding to this public key"
    proof: String!
    "A publically available alias of this ledger."
    alias: String
  }
  
  input Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String!
    amount: Currency!
    previous: String!
    balance: Currency!
    date: DateTime!
    "Proposed chain id"
    chain: String!
  }
  
  input InitialTransaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    balance: Currency!
    date: DateTime!
    proof: String!
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
    register(registration: LedgerRegistration!, transaction: InitialTransaction!): Ledger
  }
`
