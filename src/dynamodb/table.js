import { reduce } from 'lodash'

const methods = ['get', 'put', 'query', 'update']

function table (db, TableName) {
  const t = reduce(methods, (table, method) => {
    table[method] = async (param) => {
      param.TableName = TableName
      // console.log(`Executing ${method} on ${TableName} with ${JSON.stringify(param, null, 2)}`)
      return db[method](param)
    }
    return table
  }, {})
  // TODO: add extra options?
  // strips the surrounding stuff
  t.getItem = async (Key, errorMsg) => {
    const result = await t.get({ Key })
    if (errorMsg && !result.Item) {
      throw errorMsg
    }
    return result.Item
  }
  t.putItem = async (Item) => t.put({ Item })
  return t
}

export default table
