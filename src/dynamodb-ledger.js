import { DynamoPlus } from 'dynamo-plus'

const localOptions = {
  region: 'localhost',
  endpoint: 'http://localhost:8000'
}

const l = (params) => {
  params.TableName = 'manipona'
  return params
}

var isOffline = function () {
  // Depends on serverless-offline plugion which adds IS_OFFLINE to process.env when running offline
  return process.env.IS_OFFLINE || process.env.NODE_ENV === 'test'
}

const db = (options) => isOffline() ? DynamoPlus(localOptions) : DynamoPlus(options)

const Ledger = (db) => {
  return {
    registerKey: async (ledger) => {
      ledger.entry = 'pk'
      return db.put(l({
        Item: ledger
      }))
    },
    getKey: async (id) => {
      const result = await db.get(l({
        Key: {
          ledger: id,
          entry: 'pk'
        }
      }))
      if (!result.Item) {
        throw new Error(`Unknown id: ${id}`)
      }
      return result.Item
    }
  }
}

export { Ledger }
