import { reduce } from 'lodash'
import tools from '../core/tools'

const methods = ['get', 'put', 'query', 'update']

function table (db, TableName, options = {}) {
  const t = reduce(methods, (table, method) => {
    table[method] = async (param) => {
      const arg = {
        TableName,
        ...param,
        ...options
      }
      // console.log(`Executing ${method} on ${TableName} with ${JSON.stringify(param, null, 2)}`)
      return db[method](arg)
    }
    return table
  }, {})
  return {
    // strips the surrounding stuff
    async getItem (Key, errorMsg) {
      const result = await t.get({ Key })
      if (errorMsg && !result.Item) {
        throw errorMsg
      }
      return tools.fromDb(result.Item)
    },
    async putItem (input) {
      const Item = tools.toDb(input)
      return t.put({ Item })
    },
    async queryItems (query) {
      return tools.fromDb(await t.query(query))
    },
    attributes (attributes) {
      return table(db, TableName, { AttributesToGet: attributes, ...options })
    },
    transaction () {
      const TransactItems = []
      return {
        putItem (input) {
          TransactItems.push({
            Put: {
              TableName,
              Item: tools.toDb(input),
              ...options
            } })
        },
        updateItem ({ Key }, args) {
          TransactItems.push({
            Update: {
              TableName,
              Key,
              ...args
            }
          })
        },
        attributes () {}, // we ignore this as we don't expect transactional gets
        items () {
          return TransactItems
        },
        async execute () {
          // console.log(JSON.stringify(TransactItems, null, 2))
          return db.transactWrite({ TransactItems })
        }
      }
    }
  }
}

export default table
