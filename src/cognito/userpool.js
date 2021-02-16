import AWS from 'aws-sdk'
import { promisify } from 'util'
import { reduce } from 'lodash'

// TODO: continue the pagination token
const CognitoUserPool = (UserPoolId) => {
  return {
    listJubileeUsers: async (PaginationToken) => {
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

export { CognitoUserPool }
