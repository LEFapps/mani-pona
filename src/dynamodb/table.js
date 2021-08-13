import { reduce } from 'lodash'
import loglevel from 'loglevel'
import tools from '../../client/shared/tools'

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
        // console.log(`Executing ${method} on ${TableName} with ${JSON.stringify(param, null, 2)}`)
        return db[method](arg)
      }
      return table
    },
    {}
  )
  async function getItem (Key, errorMsg) {
    const result = await t.get({ Key })
    if (errorMsg && !result.Item) {
      throw errorMsg
    }
    return tools.fromDb(result.Item)
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
            loglevel.error(JSON.stringify(result.err, null, 2))
            throw result.err
          }
          return TransactItems.length
        }
      }
    }
  }
}

export default table
