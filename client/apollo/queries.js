import React from 'react'
import { gql } from '@apollo/client'

const TIME = gql`
  query {
    time
  }
`

const REGISTER = gql`
  query($registration: LedgerRegistration!) {
    system {
      register(registration: $registration)
    }
  }
`
const SYSTEM_CHALLENGE = gql`
  query {
    system {
      challenge
    }
  }
`
const CURRENT = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        current {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
        }
      }
    }
  }
`
const RECENT = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        recent {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
        }
      }
    }
  }
`
const PENDING = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        pending {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
          challenge
          message
          toSign
        }
      }
    }
  }
`
const CHALLENGE = gql`
  query challenge($id: String!, $destination: String!, $amount: Currency!) {
    ledger(id: $id) {
      transactions {
        challenge(destination: $destination, amount: $amount)
      }
    }
  }
`
const CREATE = gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        create(proof: $proof)
      }
    }
  }
`
const CONFIRM = gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        confirm(proof: $proof)
      }
    }
  }
`
const CANCEL = gql`
  query ledger($id: String!, $challenge: String!) {
    ledger(id: $id) {
      transactions {
        cancel(challenge: $challenge)
      }
    }
  }
`
const FIND_KEY = gql`
  query findkey($id: String!) {
    system {
      findkey(id: $id) {
        alias
        publicKeyArmored
      }
    }
  }
`
const JUBILEE = gql`
  mutation jubilee($ledger: String) {
    admin {
      jubilee(ledger: $ledger) {
        ledgers
        demurrage
        income
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

export {
  REGISTER,
  SYSTEM_CHALLENGE,
  CURRENT,
  RECENT,
  PENDING,
  CHALLENGE,
  CREATE,
  CONFIRM,
  CANCEL,
  FIND_KEY,
  JUBILEE,
  INIT,
  SYSTEM_PARAMETERS,
  TIME
}
