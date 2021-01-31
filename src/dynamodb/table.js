import { reduce } from 'lodash'

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
      return result.Item
    },
    async putItem (Item) { return t.put({ Item }) },
    attributes (attributes) {
      return table(db, TableName, { AttributesToGet: attributes, ...options })
    },
    transaction () {
      const TransactItems = []
      return {
        putItem (Item) {
          TransactItems.push({
            Put: {
              TableName,
              Item,
              ...options
            } })
        },
        attributes () {}, // we ignore this as we don't expect transactional gets
        items () {
          return TransactItems
        },
        async execute () {
          return db.transactWrite({ TransactItems })
        }
      }
    }
  }
}

export default table
