import { ApolloError, ForbiddenError } from 'apollo-server'
import { wrap } from '../util'

const system = {
  Query: {
    'system': () => { return {} }
  },
  'System': {
    'parameters': wrap(async (_, args, { ledgers }) => {
      return ledgers.system.parameters()
    })
  },
  'Mutation': {
    'init': wrap(async (_, noargs, { userpool, admin, ledgers }) => {
      if (!admin) {
        throw new ForbiddenError('Access denied')
      }
      return ledgers.system.init()
    }),
    'jubilee': wrap(async (_, noargs, { userpool, admin, ledgers }) => {
      // TODO
      return {}
    })
  }
}

export default system
