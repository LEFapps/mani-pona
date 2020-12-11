import { ApolloError } from 'apollo-server'
import { Verifier } from '../crypto'
import { Ledger } from '../dynamodb-ledger'

// TODO: randomly rotate?
const challengeGenerator = () => 'This is my key, verify me'

export default {
  Query: {
    hello: () => 'Hello, world!',
    challenge: challengeGenerator,
    findkey: async (_, { id }, { db }) => {
      try {
        return await Ledger(db).getKey(id)
      } catch (err) {
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
    register: async (_, { ledger, proof }, { db }) => {
      try {
        const publicKey = await Verifier(ledger.publicKey)
        await publicKey.verify(challengeGenerator(), proof)
        ledger.ledger = await publicKey.fingerprint()
        await Ledger(db).registerKey(ledger)
        // console.log(ledger)
        return ledger
      } catch (err) {
        throw new ApolloError(err)
      }
    }
  }
}
