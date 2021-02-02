import { gql } from 'apollo-server'

const TIME = gql`
  query {
    time
  }
`

// Challenge query:
const CHALLENGE = gql`
  query {
    system {
      challenge
    }
  }
`

// Registration mutation:
const REGISTER = gql`
  query ($registration: LedgerRegistration!) {
    system {
      register(registration: $registration)
    }
  }
`

const FIND_KEY = gql`
  query findkey ($id: String!) {
    system { 
      findkey(id: $id) {
        alias
        publicKeyArmored
      }
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
    admin {
      init
    }
  }
`

const JUBILEE = gql`
  mutation jubilee {
    admin {
      jubilee {
        accounts
        demurrage
        income
      }
    }
  }
`

export { TIME, REGISTER, CHALLENGE, FIND_KEY, ALL_TRANSACTIONS, PENDING_TRANSACTION, SYSTEM_PARAMETERS, JUBILEE, INIT }
