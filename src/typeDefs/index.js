import { gql } from 'apollo-server-lambda'

export default gql`

  type Query {
    "An example hello"
    hello: String
    "Text to be signed by client to verify key ownership"
    challenge: String!
    "Find the public key corresponding to this fingerprint"
    findkey(fingerprint: String!): String!
  }

  type Ledger {
    "The unique id of the ledger, a hash of its public key."
    id: String!
    "A user readable alias for this ledger."
    alias: String
  }

  type LedgerRegistration {
    "The public key used to create the ledger."
    key: String!
    "A publically available alias of this ledger."
    alias: String
  }

  type Mutation {
    "Takes a public key and returns its ledger id"
    register(key: String!, proof: String!): String!
  }
`
