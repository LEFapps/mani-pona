import _ from 'lodash'
import { mani, convertMani } from './mani'

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

// const db = (options) => isOffline() ? DynamoPlus(localOptions) : DynamoPlus(options)
/**
 * Note: errors are supposed to be caught in the resolvers
 */
const Ledger = (db) => {
  return {
    system: {
      parameters: async () => {
        const result = await db.get(l({
          Key: {
            ledger: 'system',
            entry: 'parameters'
          }
        }))
        if (!result.Item) {
          throw new Error('Missing system parameters')
        }
        return result.Item
      }
    },
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
            Item: convertMani(transaction)
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
        },
        current: async () => {
          return db.get(l({
            Key: {
              ledger: id,
              entry: '/current'
            }
          }))
        },
        pending: async () => {
          return db.get(l({
            Key: {
              ledger: id,
              entry: 'pending'
            }
          }))
        },
        make: async (current, transaction) => {
          // TODO: check integrity?
          // clobber current transaction:
          const currentEntry = `/${current.date.toISOString()}/${current.type}/${current.paraph.ledger}`
          await db.updateItem(l({
            Key: {
              ledger: id,
              entry: '/current'
            },
            UpdateExpression: 'set entry = :entry',
            ExpressionAttributeValues: {
              ':entry': currentEntry
            }
          }))
          return db.putItem(l({
            Item: {
              ledger: id,
              entry: 'pending'
            }
          }))
        }
      }
    }
  }
}

export { Ledger }
