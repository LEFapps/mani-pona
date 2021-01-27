import { gql } from 'apollo-server-lambda'

const system = gql`
  type SystemParameters {
    # the (monthly) (basic) income
    income: Currency!
    # (monthly) demurrage in percentage (so 5.0 would be a 5% demurrage)
    demurrage: NonNegativeFloat!
  }

  type System {
    parameters: SystemParameters!
  }

  type Jubilee {
    accounts: Int
    demurrage: Currency!
    income: Currency!
  }

  type Query {
    # access to system internals
    system: System!
  }

  type Mutation {
    # apply demurrage and (basic) income to all accounts
    jubilee: Jubilee!
  }
`

export default system
