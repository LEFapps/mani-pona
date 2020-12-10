import { ApolloError } from 'apollo-server'
import { Verifier } from '../crypto'

// TODO: randomly rotate?
const challengeGenerator = () => 'This is my key, verify me'

export default {
  Query: {
    hello: () => 'Hello, world!',
    challenge: challengeGenerator,
    findkey: (fingerprint) => ''
  },
  Mutation: {
    /**
     * Register the supplied (public) key, after checking if the challenge was correctly
     * signed, resulting in the `proof`. The key is then stored as the start of a new
     * ledger and the `zeroth` transaction is added.
     */
    register: async (parent, { key, proof }, { db }) => {
      try {
        return await Verifier(key).verify(challengeGenerator(), proof)
      } catch (err) {
        throw new ApolloError(err)
      }
    }
  }
}
