import { gql } from 'apollo-server-lambda'

export default gql`
  type MollieQuery {
    "Initiate a payment through Mollie"
    startPayment(amount: String!, ledger: String): String
  }

  type Mutation {
    "All ledger related queries"
    mollie: MollieQuery
  }
`
