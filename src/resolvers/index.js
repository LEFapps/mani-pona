import { ApolloError, ForbiddenError } from 'apollo-server'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { DateTimeResolver } from 'graphql-scalars'
import log from 'loglevel'
import _ from 'lodash'
import { Verifier } from '../crypto'
import { LedgerCheck } from '../integrity'
import { Ledger } from '../dynamodb-ledger'
import { mani, Mani, convertMani } from '../mani'

// TODO: randomly rotate?
const challengeGenerator = () => 'This is my key, verify me'

/**
 * Since Apollo Server has its own ideas about error logging, we intercept them early.
 * This function wraps an asynchronous function that might throw an error.
 */
const wrap = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      log.error(err)
      throw new ApolloError(err)
    }
  }
}

export default {
  DateTime: DateTimeResolver,
  Currency: new GraphQLScalarType({
    name: 'Currency',
    description: 'Custom scalar type for working consistently with currency-style fractions',
    // value sent to the client
    serialize (value) {
      if (value instanceof Mani) {
        return value.format()
      } else {
        // note that this is quite permissive and will even allow something like "MANI 10 00,5" as input
        return mani(value).format()
      }
    },
    // value from the client
    parseValue (value) {
      return mani(value)
    },
    // value from client in AST representation
    parseLiteral (ast) {
      if (ast.kind !== Kind.STRING || ast.kind !== Kind.INT || ast.kind !== Kind.FLOAT) {
        throw new TypeError(
          `Unknown representation of currency ${'value' in ast && ast.value}`
        )
      }
      return mani(ast.value)
    }
  }),
  Query: {
    hello: () => 'Hello, world!',
    challenge: challengeGenerator,
    findkey: wrap(async (_, { id }, { db }) => {
      return Ledger(db).keys.get(id)
    }),
    ledger: (_, { id }) => {
      // optional: check if this even exists?
      return id
    },
    system: () => {
      return {}
    }
  },
  'System': {
    'parameters': wrap(async (_, args, { db }) => {
      return Ledger(db).system.parameters()
    })
  },
  'LedgerQuery': {
    'transactions': (id, arg, { db, ledger, verified }) => {
      if (id !== ledger) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`
        log.error(err)
        throw new ForbiddenError(err)
      }
      return id
    }
  },
  'TransactionQuery': {
    'all': wrap(async (id, arg, { db }) => {
      return Ledger(db).transactions(id).all()
    }),
    'pending': async (id, arg, { db }) => {
    }
  },
  Mutation: {
    /**
     * Register the supplied ledger, after checking if the challenge was correctly
     * signed, resulting in the `proof`. The key is then stored as the start of a new
     * ledger and the `zeroth` transaction is added.
     */
    register: wrap(async (_, { registration, transaction }, { db }) => {
      const { publicKey, alias, proof } = registration
      const verifier = await Verifier(publicKey)
      const challenge = challengeGenerator()
      await verifier.verify(challenge, proof)
      const ledgerCheck = LedgerCheck(verifier)
      transaction.type = 'init'
      transaction.previous = ''
      await ledgerCheck.initialTransaction(transaction)
      const fingerprint = await verifier.fingerprint()
      const ledger = {
        ledger: fingerprint,
        alias,
        publicKey,
        challenge,
        proof
      }
      await Ledger(db).keys.register(ledger)
      await Ledger(db).transactions(fingerprint).save(transaction)
      // console.log(ledger)
      return ledger
    }),
    jubilee: async (root, noargs, { db, userpool, admin, ledger }) => {
      if (!admin) {
        log.error(`Illegal access attempt to jubilee by ${ledger}`)
        throw new ForbiddenError('Unauthorized access')
      }
      const output = {
        ledgers: 0,
        income: mani(0),
        demurrage: mani(0)
      }
      const L = Ledger(db)
      const { income, demurrage } = await L.system.parameters()
      const resp = await userpool.getUsers() // add pagination token?
      resp.Users.forEach((user) => {
        const ledgerEntry = _.find(user.Attributes, ['Name', 'ledger'])
        if (!ledgerEntry) {
          log.error(`No ledger attribue for cognito user ${JSON.stringify(user)}`)
        }
        const ledger = ledgerEntry.Value
        const current = L.transactions(ledger).current()
        if (!current) {
          throw new ApolloError(`No /current transaction on ledger ${ledger}`)
        }
         
      })
      return convertMani(output)
    }
  }
}
