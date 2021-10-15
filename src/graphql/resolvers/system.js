import { ForbiddenError } from 'apollo-server'
import { getLogger } from 'server-log'

const log = getLogger('graphql:system')

export default {
  Query: {
    'system': (_, args, { core }) => {
      return core.system()
    }
  },
  'Mutation': {
    'admin': (_, args, { core, admin, ledger, claims }) => {
      if (!admin) {
        log.error(`Illegal system access attempt by ${ledger}`)
        throw new ForbiddenError('Access denied')
      }
      // TODO: log claims
      return core.system()
    }
  },
  'System': {
    'register': async (system, { registration }, { username }) => {
      return system.register(registration, username)
    },
    'parameters': async (system) => {
      return system.parameters()
    },
    'challenge': async (system) => {
      return system.challenge()
    },
    'findkey': async (system, { id }) => {
      return system.findkey(id)
    },
    'finduser': async (system, { username }) => {
      return system.findUser(username)
    },
    'accountTypes': async (system) => {
      return system.getAccountTypes()
    }
  },
  'Admin': {
    'init': async (system) => {
      return system.init()
    },
    'jubilee': async (system, { paginationToken }) => {
      return system.jubilee(paginationToken)
    },
    'changeAccountType': async (system, { username, type }) => {
      const result = await system.changeAccountType(username, type)
      log.debug('Changed account %s to type %s, result %j', username, type, result)
      return `Changed account type of ${username} to ${type}`
    },
    'disableAccount': async (system, { username }) => {
      const result = await system.disableAccount(username)
      log.debug('Disabled account %s, result %j', username, result)
      return `Disabled account ${username}`
    },
    'enableAccount': async (system, { username }) => {
      const result = await system.enableAccount(username)
      log.debug('Enabled account %s, result %j', username, result)
      return `Enabled account ${username}`
    },
    'forceSystemPayment': async (system, { ledger, amount }) => {
      const result = await system.forceSystemPayment(ledger, amount)
      return `Forced system payment of ${amount} on ledger ${ledger}, result: ${result}`
    }
  }
}
