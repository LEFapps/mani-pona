import AWS from 'aws-sdk'
import { promisify } from 'util'

AWS.config.region = 'eu-west-1'

// TODO: continue the pagination token
const userpool = (userPoolId) => {
  return {
    getUsers: async (paginationToken) => {
      const provider = new AWS.CognitoIdentityServiceProvider()
      provider.listUsersPromise = promisify(provider.listUsers)
      const params = {
        UserPoolId: userPoolId,
        AttributesToGet: [ 'sub', 'username', 'cognito:user_status', 'status', 'ledger' ] // TODO: add extra verification/filters?
      }
      if (paginationToken) {
        params.PaginationToken = paginationToken
      }
      return provider.listUsersPromise(params)
    }
  }
}

export default userpool
