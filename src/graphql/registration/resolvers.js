import { wrap } from '../util'
import { Verifier } from '../../../client/shared/crypto'

const STATIC_CHALLENGE = 'This is my key, verify me'

const resolvers = {
  Query: {
    findkey: wrap(async (_, { id }, { indexDynamo }) => {
      return indexDynamo.findkey(id)
    })
  },
  Mutation: {
    register: wrap(async (_, { registration }, { indexDynamo }) => {
      const { publicKeyArmored, proof } = registration
      const verifier = await Verifier(publicKeyArmored)
      await verifier.verify(STATIC_CHALLENGE, proof)
      const fingerprint = await verifier.fingerprint()
      await indexDynamo.register({
        ledger: fingerprint,
        challenge: STATIC_CHALLENGE, // for prosperity
        ...registration
      })
      await indexDynamo.system.initLedger(fingerprint)
      return fingerprint
    })
  }
}

export default resolvers
