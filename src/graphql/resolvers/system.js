import { ForbiddenError } from 'apollo-server'
import SystemCore from '../../core/system'
import { getLogger } from 'server-log'

const log = getLogger('graphql:system')

const SystemResolvers = {
  Query: {
    'system': (_, args, { indexDynamo, userpool }) => {
      return SystemCore(indexDynamo.table, userpool)
    }
  },
  'Mutation': {
    'admin': (_, args, { indexDynamo, admin, userpool, ledger }) => {
      if (!admin) {
        log.error(`Illegal system access attempt by ${ledger}`)
        throw new ForbiddenError('Access denied')
      }
      return SystemCore(indexDynamo.table, userpool)
    }
  },
  'System': {
    'register': async (SystemCore, { registration }, { indexDynamo }) => {
      return SystemCore.register(registration)
    },
    'parameters': async (SystemCore, args, { indexDynamo }) => {
      return SystemCore.parameters()
    },
    'challenge': async (SystemCore) => {
      return SystemCore.challenge()
    },
    'findkey': async (SystemCore, { id }, { indexDynamo }) => {
      return indexDynamo.findkey(id)
    }
  },
  'Admin': {
    'init': async (SystemCore, noargs, { admin }) => {
      return SystemCore.init()
    },
    'jubilee': async (SystemCore, { ledger }, { userpool, admin }) => {
      return SystemCore.jubilee(ledger)
    }
  }
}

export { SystemResolvers }
