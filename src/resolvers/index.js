import { ApolloError } from 'apollo-server'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { Verifier } from '../crypto'
import { LedgerCheck } from '../integrity'
import { Ledger } from '../dynamodb-ledger'
import mani from '../client/currency'
import { DateTimeResolver } from 'graphql-scalars'
import log from 'loglevel'

// TODO: randomly rotate?
const challengeGenerator = () => 'This is my key, verify me'

export default {
  DateTime: DateTimeResolver,
  Currency: new GraphQLScalarType({
    name: 'Currency',
    description: 'Custom scalar type for working consistently with currency-style fractions',
    // value sent to the client
    serialize (value) {
      if (value instanceof mani) {
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
    findkey: async (_, { id }, { db }) => {
      try {
        return await Ledger(db).keys.get(id)
      } catch (err) {
        log.error(err)
        throw new ApolloError(err)
      }
    },
    ledger: (_, { id }) => {
      // optional: check if this even exists?
      return id
    }
  },
  'LedgerQuery': {
    'transactions': (id, arg, { db }) => {
      return id
    }
  },
  'TransactionQuery': {
    'all': async (id, arg, { db }) => {
      try {
        return await Ledger(db).transactions(id).all()
      } catch (err) {
        log.error(err)
        throw new ApolloError(err)
      }
    }
  },
  Mutation: {
    /**
     * Register the supplied ledger, after checking if the challenge was correctly
     * signed, resulting in the `proof`. The key is then stored as the start of a new
     * ledger and the `zeroth` transaction is added.
     */
    register: async (_, { registration, transaction }, { db }) => {
      try {
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
      } catch (err) {
        log.error(err)
        throw new ApolloError(err)
      }
    }
  }
}
