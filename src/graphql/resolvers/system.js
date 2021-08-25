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
    'admin': (_, args, { core, admin, ledger }) => {
      if (!admin) {
        log.error(`Illegal system access attempt by ${ledger}`)
        throw new ForbiddenError('Access denied')
      }
      return core.system()
    }
  },
  'System': {
    'register': async (system, { registration }) => {
      return system.register(registration)
    },
    'parameters': async (system) => {
      return system.parameters()
    },
    'challenge': async (system) => {
      return system.challenge()
    },
    'findkey': async (system, { id }) => {
      return system.findkey(id)
    }
  },
  'Admin': {
    'init': async (system) => {
      return system.init()
    },
    'jubilee': async (system, { ledger }) => {
      return system.jubilee(ledger)
    }
  }
}
