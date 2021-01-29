import { wrap } from '../util'
import { Verifier } from '../../crypto'

const STATIC_CHALLENGE = 'This is my key, verify me'

const resolvers = {
  Query: {
    challenge: () => STATIC_CHALLENGE, // TODO: randomly rotate?
    findkey: wrap(async (_, { id }, { ledgers }) => {
      return ledgers.findkey(id)
    })
  },
  Mutation: {
    register: wrap(async (_, { registration }, { ledgers }) => {
      const { publicKeyArmored, proof } = registration
      const verifier = await Verifier(publicKeyArmored)
      await verifier.verify(STATIC_CHALLENGE, proof)
      const fingerprint = await verifier.fingerprint()
      const ledger = await ledgers.register({
        ledger: fingerprint,
        challenge: STATIC_CHALLENGE, // for prosperity
        ...registration }
      )

      return ledger
    })
  }
}

export default resolvers
