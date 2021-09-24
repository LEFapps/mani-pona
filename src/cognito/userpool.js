import AWS from 'aws-sdk'
import { promisify } from 'util'
import { reduce } from 'lodash'

import { getLogger } from 'server-log'

const log = getLogger('cognito')

// TODO: continue the pagination token
const CognitoUserPool = (UserPoolId) => {
  log.debug('Configured with user pool %s', UserPoolId)
  const convertAttributes = (attr) => reduce(attr, (acc, att) => {
    acc[att.Name.replace('custom:', '')] = att.Value
    return acc
  }, {})
  const convertUser = ({ Attributes, UserAttributes, ...user }) => {
    const {
      Username: username,
      UserStatus: status,
      UserCreateDate: created,
      UserLastModifiedDate: lastModified,
      Enabled: enabled } = user
    return {
      username,
      status,
      created,
      lastModified,
      enabled,
      ...convertAttributes(Attributes), // this is what listUsers uses...
      ...convertAttributes(UserAttributes) // ... and this is what adminGetUser uses
    }
  }
  const provider = new AWS.CognitoIdentityServiceProvider()
  return {
    getAccountTypes () {
      const config = process.env.ACCOUNT_TYPES
      if (!config) {
        log.error('Missing ACCOUNT_TYPES ENV variable')
        return []
      }
      return JSON.parse(config)
    },
    disableUser (Username) {
      provider.adminDisableUser = promisify(provider.adminDisableUser)
      return provider.adminDisableUser({
        UserPoolId,
        Username
      })
    },
    enableUser (Username) {
      provider.adminEnableUser = promisify(provider.adminEnableUser)
      return provider.adminEnableUser({
        UserPoolId,
        Username
      })
    },
    changeAttributes (Username, attributes) {
      provider.adminUpdateUserAttributes = promisify(provider.adminUpdateUserAttributes)
      const UserAttributes = Object.entries(attributes).map(([Name, Value]) => { return { Name, Value } })
      return provider.adminUpdateUserAttributes({
        UserPoolId,
        Username,
        UserAttributes
      })
    },
    listJubileeUsers: async (PaginationToken) => {
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
      log.debug('Found %n users', cognitoUsers.data.Users.length)
      return cognitoUsers.data.Users.map(convertUser)
    },
    findUser: async (Username) => {
      provider.adminGetUser = promisify(provider.adminGetUser)
      const result = await provider.adminGetUser({ UserPoolId, Username })
      if (result) {
        log.debug('Cognito result: %j', result)
        const user = convertUser(result)
        log.debug('User: %j', user)
        return user
      }
    }
  }
}

export { CognitoUserPool }
