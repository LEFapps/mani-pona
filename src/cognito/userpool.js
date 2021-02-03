import AWS from 'aws-sdk'
import { promisify } from 'util'
import { reduce } from 'lodash'

AWS.config.region = 'eu-west-1'

// TODO: continue the pagination token
const userpool = (UserPoolId) => {
  return {
    getUsers: async (PaginationToken) => {
      const provider = new AWS.CognitoIdentityServiceProvider()
      provider.listUsersPromise = promisify(provider.listUsers)
      const params = {
        UserPoolId,
        PaginationToken,
        AttributesToGet: [ 'sub', 'username', 'cognito:user_status', 'status', 'ledger' ] // TODO: add extra verification/filters?
      }
      const cognitoUsers = await provider.listUsersPromise(params)
      if (cognitoUsers.err) {
        throw cognitoUsers.err
      }
      return cognitoUsers.data.Users.map(({ Username, Attributes }) => {
        return {
          username: Username,
          ...reduce(Attributes, (acc, att) => {
            acc[att.Name] = att.Value
            return acc
          }, {})
        }
      })
    }
  }
}

export default userpool
