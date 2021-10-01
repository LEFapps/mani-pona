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
  mutation jubilee($paginationToken: String) {
    admin {
      jubilee(paginationToken: $paginationToken) {
        ledgers
        demurrage
        income
        nextToken
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
const FIND_USER = gql`
  query finduser($username: String!) {
    system {
      finduser(username: $username) {
        alias
        sub
        email
        email_verified
        administrator
        status
        enabled
        created
        lastModified
        ledger
        type
      }
    }
  }
`

const DISABLE_USER = gql`
  mutation disableuser($username: String!) {
    admin {
      disableUser(username: $username)
    }
  }
`

const ENABLE_USER = gql`
  mutation enableuser($username: String!) {
    admin {
      enableUser(username: $username)
    }
  }
`
const ACCOUNT_TYPES = gql`
  query accounttypes {
    system {
      accountTypes {
        type
        income
        buffer
        demurrage
      }
    }
  }
`

const CHANGE_ACCOUNT_TYPE = gql`
  mutation changetype($username: String!, $type: String!) {
    admin {
      changeAccountType(username: $username, type: $type)
    }
  }
`

const FORCE_SYSTEM_PAYMENT = gql`
  mutation force($ledger: String!, $amount: Currency!) {
    admin {
      forceSystemPayment(ledger: $ledger, amount: $amount)
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
  FIND_USER,
  DISABLE_USER,
  ENABLE_USER,
  ACCOUNT_TYPES,
  CHANGE_ACCOUNT_TYPE,
  FORCE_SYSTEM_PAYMENT,
  JUBILEE,
  INIT,
  SYSTEM_PARAMETERS,
  TIME
}
