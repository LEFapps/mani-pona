import { ForbiddenError } from 'apollo-server'
import { wrap } from '../util'
import system from '../../core/system'

const resolvers = {
  Query: {
    'system': () => { return {} }
  },
  'System': {
    'parameters': wrap(async (_, args, { ledgers }) => {
      return ledgers.system.parameters()
    })
  },
  'Mutation': {
    'init': wrap(async (_, noargs, { admin, ledgers }) => {
      if (!admin) {
        throw new ForbiddenError('Access denied')
      }
      return system(ledgers.system, ledgers.transactions('system')).init()
    }),
    'jubilee': wrap(async (_, noargs, { userpool, admin, ledgers }) => {
      // TODO
      return {}
    })
  }
}

export default resolvers
