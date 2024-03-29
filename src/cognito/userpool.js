import AWS from 'aws-sdk'
import { promisify } from 'util'
import { getLogger } from 'server-log'
import { getAccountTypes } from './util'

const log = getLogger('cognito')

const CognitoUserPool = UserPoolId => {
  const USER_LIST_LIMIT = parseInt(process.env.COGNITO_LIMIT) || 20
  log.debug(
    'Cognito configured with user pool %s and list limit %n',
    UserPoolId,
    USER_LIST_LIMIT
  )
  const convertAttributes = (attr = []) =>
    attr.reduce((acc, att) => {
      acc[att.Name.replace('custom:', '')] = att.Value
      return acc
    }, {})
  const convertUser = ({ Attributes, UserAttributes, ...user }) => {
    const {
      Username: username,
      UserStatus: status,
      UserCreateDate: created,
      UserLastModifiedDate: lastModified,
      Enabled: enabled
    } = user
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
    getAccountTypes,
    async disableAccount (Username) {
      provider.adminDisableUser = promisify(provider.adminDisableUser)
      return provider.adminDisableUser({
        UserPoolId,
        Username
      })
    },
    async deleteAccount (Username) {
      provider.adminDeleteUser = promisify(provider.adminDeleteUser)
      return provider.adminDeleteUser({
        UserPoolId,
        Username
      })
    },
    async enableAccount (Username) {
      provider.adminEnableUser = promisify(provider.adminEnableUser)
      return provider.adminEnableUser({
        UserPoolId,
        Username
      })
    },
    async changeAttributes (Username, attributes) {
      provider.adminUpdateUserAttributes = promisify(
        provider.adminUpdateUserAttributes
      )
      const UserAttributes = Object.entries(attributes).map(([Name, Value]) => {
        return { Name, Value }
      })
      return provider.adminUpdateUserAttributes({
        UserPoolId,
        Username,
        UserAttributes
      })
    },
    async listJubileeUsers (PaginationToken) {
      provider.listUsersPromise = promisify(provider.listUsers)
      const params = {
        UserPoolId,
        PaginationToken,
        Limit: USER_LIST_LIMIT
        // AttributesToGet: [
        // 'sub',
        // 'username',
        // 'cognito:user_status',
        // 'status',
        // 'custom:ledger',
        // 'custom:type'
        // ] // TODO: add extra verification/filters?
      }
      const res = await provider.listUsersPromise(params)
      if (res.err) {
        throw res.err
      }
      log.debug('Found %n users', res.Users.length)
      return {
        users: res.Users.map(convertUser),
        paginationToken: res.PaginationToken
      }
    },
    async findUser (Username) {
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
