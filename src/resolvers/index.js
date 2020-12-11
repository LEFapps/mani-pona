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
    register: async (_, { registration }, { db }) => {
      try {
        const { publicKey, alias, proof } = registration
        const verifier = await Verifier(publicKey)
        const challenge = challengeGenerator()
        await verifier.verify(challenge, proof)
        const ledger = {
          ledger: await verifier.fingerprint(),
          alias,
          publicKey,
          challenge,
          proof
        }
        await Ledger(db).registerKey(ledger)
        // console.log(ledger)
        return ledger
      } catch (err) {
        throw new ApolloError(err)
      }
    }
  }
}
