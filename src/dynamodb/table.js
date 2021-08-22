import { reduce } from 'lodash'
import { getLogger } from 'server-log'
import tools from '../../client/shared/tools'
const log = getLogger('dynamodb:table')
const methods = ['get', 'put', 'query', 'update']

/**
 * This helps significantly reduce the amount of DynamoDB code duplication. Essentially, it reuses the TableName and automatically constructs typical DynamoDB commands from input parameters and regular methods.
 *
 * By using `transaction()`, a similar set of functions is available, except the entire transaction (set of commands) needs to be executed at the end.
 */

function table (db, TableName, options = {}) {
  const t = reduce(
    methods,
    (table, method) => {
      table[method] = async param => {
        const arg = {
          TableName,
          ...param,
          ...options
        }
        return db[method](arg)
      }
      return table
    },
    {}
  )
  async function getItem (Key, errorMsg) {
    log.debug('Getting item: \n%j', Key)
    try {
      const result = await t.get({ Key })
      if (errorMsg && !result.Item) {
        throw errorMsg
      }
      log.debug('Found item: %o', result.Item)
      return tools.fromDb(result.Item)
    } catch (err) {
      log.error(err)
      throw err
    }
  }
  async function queryItems (query) {
    const items = (await t.query(query)).Items
    return tools.fromDb(items)
  }
  return {
    getItem,
    queryItems,
    async putItem (input) {
      const Item = tools.toDb(input)
      return t.put({ Item })
    },
    attributes (attributes) {
      return table(db, TableName, { AttributesToGet: attributes, ...options })
    },
    transaction () {
      const TransactItems = []
      return {
        getItem,
        putItem (input) {
          TransactItems.push({
            Put: {
              TableName,
              Item: tools.toDb(input),
              ...options
            }
          })
        },
        updateItem (Key, args) {
          TransactItems.push({
            Update: {
              TableName,
              Key,
              ...tools.toDb(args)
            }
          })
        },
        deleteItem (Key, args) {
          TransactItems.push({
            Delete: {
              TableName,
              Key,
              ...tools.toDb(args)
            }
          })
        },
        attributes () {}, // we ignore this as we don't expect transactional gets
        items () {
          return TransactItems
        },
        async execute () {
          const result = await db.transactWrite({ TransactItems })
          if (result.err) {
            log.error('Error executing transaction: %j', result.err)
            throw result.err
          }
          return TransactItems.length
        }
      }
    }
  }
}

export default table
