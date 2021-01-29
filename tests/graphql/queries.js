import { gql } from 'apollo-server'

const SAY_HELLO = gql`
  {
    hello
  }
`
// Registration mutation:
const REGISTER = gql`
  mutation ($registration: LedgerRegistration!) {
    register(registration: $registration)
  }
`
// Challenge query:
const CHALLENGE = gql`
  {
    challenge
  }
`

const FIND_KEY = gql`
  query findkey ($id: String!) {
    findkey(id: $id) {
      alias
      publicKeyArmored
    }
  }
`

const ALL_TRANSACTIONS = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        all {
          ledger
          balance
          date
        }
      }
    }
  }
`

const PENDING_TRANSACTION = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        pending {
          ledger
          amount
          date
        }
      }
    }
  }
`
const SYSTEM_PARAMETERS = gql`
  query {
    system {
      parameters {
        income
        demurrage
      }
    }
  }
`

const INIT = gql`
  mutation init {
    init
  }
`

const JUBILEE = gql`
  mutation jubilee {
    jubilee {
      accounts
      demurrage
      income
    }
  }
`

export { SAY_HELLO, REGISTER, CHALLENGE, FIND_KEY, ALL_TRANSACTIONS, PENDING_TRANSACTION, SYSTEM_PARAMETERS, JUBILEE, INIT }
