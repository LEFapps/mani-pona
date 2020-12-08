import * as openpgp from 'openpgp'
import { ApolloError } from 'apollo-server'

// TODO: randomly rotate?
const challengeGenerator = () => 'This is my key, verify me'

export default {
  Query: {
    hello: () => 'Hello, world!',
    challenge: challengeGenerator
  },
  Mutation: {
    register: async (parent, { key, proof }, { db }) => {
      // console.log(args)
      const { err, keys: [pk] } = await openpgp.key.readArmored(key)
      if (err) {
        throw new ApolloError(err[0])
      }
      // console.log(`KEY: \n${key}`)
      // console.log(`PROOF: \n${proof}`)
      try {
        const { signatures } = await openpgp.verify({
          message: openpgp.cleartext.fromText(challengeGenerator()),
          signature: await openpgp.signature.readArmored(proof),
          publicKeys: [pk]
        })
        if (signatures[0].valid) {
          return pk.getFingerprint()
        } else {
          return new ApolloError('The proof signature didn\'t match either this key or the challenge.')
        }
      } catch (err) {
        throw new ApolloError(err)
      }
    }
  }
}
