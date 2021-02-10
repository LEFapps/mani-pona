import { ForbiddenError } from 'apollo-server'
import { wrap } from '../util'
import SystemCore from '../../core/system'
import log from 'loglevel'

const SystemResolvers = {
  Query: {
    'system': wrap((_, args, { indexDynamo, userpool }) => {
      return SystemCore(indexDynamo.table, userpool)
    })
  },
  'Mutation': {
    'admin': wrap((_, args, { indexDynamo, admin, userpool, ledger }) => {
      if (!admin) {
        log.error(`Illegal system access attempt by ${ledger}`)
        throw new ForbiddenError('Access denied')
      }
      return SystemCore(indexDynamo.table, userpool)
    })
  },
  'System': {
    'register': wrap(async (SystemCore, { registration }, { indexDynamo }) => {
      return SystemCore.register(registration)
    }),
    'parameters': wrap(async (SystemCore, args, { indexDynamo }) => {
      return SystemCore.parameters()
    }),
    'challenge': wrap(async (SystemCore) => {
      return SystemCore.challenge()
    }),
    'findkey': wrap(async (SystemCore, { id }, { indexDynamo }) => {
      return indexDynamo.findkey(id)
    })
  },
  'Admin': {
    'init': wrap(async (SystemCore, noargs, { admin }) => {
      return SystemCore.init()
    }),
    'jubilee': wrap(async (SystemCore, noargs, { userpool, admin }) => {
      return SystemCore.jubilee(userpool)
    })
  }
}

export { SystemResolvers }
