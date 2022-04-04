import { gql } from 'apollo-server-lambda'

export default gql`
  type StripeQuery {
    "Initiate a payment through Stripe"
    startPayment(amount: String!, ledger: String): String
  }
  type Mutation {
    "All ledger related queries"
    stripe: StripeQuery
  }
`
