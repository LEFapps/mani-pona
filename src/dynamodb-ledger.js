import mani from './client/currency'
import _ from 'lodash'

/**
 * Possible filter methods: EQ | NE | IN | LE | LT | GE | GT | BETWEEN | NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH
 *
 * Entry:
 * '/ISOdate/type/previous'
 *
 * type: 'init' (ledger creation), 'pending', 'transaction', 'demurrage', 'income'
 * balance: entry = latest when sorting by entry NOT_CONTAINS 'pending'
 * parameter ScanIndexForward: false    // true = ascending, false = descending (most recent first!)
 * pending: entry = CONTAINS 'pending' -> use this to clobber?
 * all transactions: entry NOT_CONTAINS 'pending'
 * date range : entry between dateA and dateB? (TODO: test!)
 * special range keys: 'pk' and 'pending' -> These are unique!
 *
 */
const entry = (transaction) => {
  return `/${transaction.date.toISOString()}/${transaction.type}/${transaction.previous}`
}

const l = (params) => {
  params.TableName = 'manipona'
  return params
}
/**
 * Creates a shallow clone of the obj, with the fn applied to the specified fields, if they exist.
 */
const convertFields = (obj, fields, fn) => {
  const result = _.clone(obj)
  fields.forEach((field) => {
    if (obj[field]) {
      result[field] = fn(obj[field])
    }
  })
  return result
}

const maniFields = ['balance', 'amount']

const convert = {
  fromDb: (transaction) => {
    return convertFields(transaction, maniFields, mani)
  },
  toDb: (transaction) => {
    const result = convertFields(transaction, maniFields, m => m.format())
    result.date = result.date.toISOString()
    return result
  }
}

// const db = (options) => isOffline() ? DynamoPlus(localOptions) : DynamoPlus(options)
/**
 * Note: errors are supposed to be caught in the resolvers
 */
const Ledger = (db) => {
  return {
    keys: {
      register: async (ledger) => {
        ledger.entry = 'pk'
        return db.put(l({
          Item: ledger
        }))
      },
      get: async (id) => {
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
    },
    transactions: (id) => {
      return {
        save: async (transaction) => {
          transaction.entry = entry(transaction)
          return db.put(l({
            Item: convert.toDb(transaction)
          }))
        },
        all: async () => {
          return (await db.query(l({
            KeyConditionExpression: 'ledger = :ledger AND begins_with(entry, :slash)',
            ExpressionAttributeValues: {
              ':ledger': id,
              ':slash': '/'
            }
          }))).Items
        }
      }
    }
  }
}

export { Ledger }
