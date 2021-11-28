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
const NOTIFIERS = gql`
  query notifiers($id: String!) {
    ledger(id: $id) {
      notifications {
        value
      }
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
const AVAILABLE = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        available {
          balance
          date
          income
          demurrage
        }
      }
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
          message
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
          message
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
  query ledger(
    $id: String!
    $proof: Proof!
    $message: String
    $prepaid: Boolean
  ) {
    ledger(id: $id) {
      transactions {
        create(proof: $proof, message: $message, prepaid: $prepaid) {
          ledger
          destination
          entry
          amount
          income
          demurrage
          balance
          date
          message
        }
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
const EXPORT = gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        export
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
        requestedType
        privacy
        address
        zip
        city
        phone
        birthday
        companyTaxNumber
      }
    }
  }
`

const DISABLE_USER = gql`
  mutation disableuser($username: String!) {
    admin {
      disableAccount(username: $username)
    }
  }
`

const ENABLE_USER = gql`
  mutation enableuser($username: String!) {
    admin {
      enableAccount(username: $username)
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

const CREATE_PREPAID_LEDGER = gql`
  mutation prepaid($amount: Currency!) {
    admin {
      createPrepaidLedger(amount: $amount)
    }
  }
`

const EXPORT_LEDGERS = gql`
  mutation export {
    admin {
      exportLedgers
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
  NOTIFIERS,
  SYSTEM_CHALLENGE,
  AVAILABLE,
  CURRENT,
  RECENT,
  PENDING,
  CHALLENGE,
  CREATE,
  CONFIRM,
  CANCEL,
  EXPORT,
  FIND_KEY,
  FIND_USER,
  DISABLE_USER,
  ENABLE_USER,
  ACCOUNT_TYPES,
  CHANGE_ACCOUNT_TYPE,
  FORCE_SYSTEM_PAYMENT,
  CREATE_PREPAID_LEDGER,
  JUBILEE,
  EXPORT_LEDGERS,
  INIT,
  SYSTEM_PARAMETERS,
  TIME
}
