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
  // strips the surrounding stuff
  t.getItem = async (Key, errorMsg) => {
    const result = await t.get({ Key })
    if (errorMsg && !result.Item) {
      throw errorMsg
    }
    return result.Item
  }
  t.putItem = async (Item) => t.put({ Item })

  t.attributes = (attributes) => {
    return table(db, TableName, { AttributesToGet: attributes, ...options })
  }
  return t
}

export default table
