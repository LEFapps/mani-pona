import { ForbiddenError } from 'apollo-server'
import { getLogger } from 'server-log'

const log = getLogger('graphql:system')

export default {
  Query: {
    system: (_, args, { core }) => {
      return core.system()
    }
  },
  'Mutation': {
    admin (_, args, { core, admin, ledger, claims }) {
      if (!admin) {
        log.error(`Illegal system access attempt by ${ledger}`)
        throw new ForbiddenError('Access denied')
      }
      // TODO: log claims
      return core.system()
    }
  },
  'System': {
    async register (system, { registration }, { username }) {
      return system.register(registration, username)
    },
    async parameters (system) {
      return system.parameters()
    },
    async challenge (system) {
      return system.challenge()
    },
    async findkey (system, { id }) {
      return system.findkey(id)
    },
    async finduser (system, { username }) {
      return system.findUser(username)
    },
    async accountTypes (system) {
      return system.getAccountTypes()
    }
  },
  'Admin': {
    async init (system) {
      return system.init()
    },
    async jubilee (system, { paginationToken }) {
      return system.jubilee(paginationToken)
    },
    async changeAccountType (system, { username, type }) {
      const result = await system.changeAccountType(username, type)
      log.debug(
        'Changed account %s to type %s, result %j',
        username,
        type,
        result
      )
      return `Changed account type of ${username} to ${type}`
    },
    async disableAccount (system, { username }) {
      const result = await system.disableAccount(username)
      log.debug('Disabled account %s, result %j', username, result)
      return `Disabled account ${username}`
    },
    async enableAccount (system, { username }) {
      const result = await system.enableAccount(username)
      log.debug('Enabled account %s, result %j', username, result)
      return `Enabled account ${username}`
    },
    async forceSystemPayment (system, { ledger, amount }) {
      const result = await system.forceSystemPayment(ledger, amount)
      return `Forced system payment of ${amount} on ledger ${ledger}, result: ${result}`
    },
    async exportLedgers (system) {
      return system.exportLedgers()
    },
    async exportAccounts (system) {
      return system.exportAccounts()
    },
    async createPrepaidLedger (system, { amount }) {
      return system.createPrepaidLedger(amount)
    }
  }
}
