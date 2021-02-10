import { gql } from 'apollo-server'
const REGISTER = gql`
  query ($registration: LedgerRegistration!) {
    system {
      register(registration: $registration)
    }
  }`
const SYSTEM_CHALLENGE = gql`
  query {
    system {
      challenge
    }
  }`
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
  }`
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
        }
      }
    }
  }`
const CHALLENGE = gql`
  query challenge($id: String!, $destination: String!, $amount: Currency!) {
    ledger(id: $id) {
      transactions {
        challenge(destination: $destination, amount: $amount)
      }
    }
  }`
const CREATE = gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        create(proof: $proof)
      }
    }
  }`
const CONFIRM = gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        confirm(proof: $proof)
      }
    }
  }`

export { REGISTER, SYSTEM_CHALLENGE, CURRENT, PENDING, CHALLENGE, CREATE, CONFIRM }
