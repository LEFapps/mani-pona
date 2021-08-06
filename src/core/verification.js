import { Verifier } from '../../client/shared/crypto'

const verification = table => {
  const verification = {
    async getVerifier (ledger) {
      const result = await table
        .attributes(['publicKeyArmored'])
        .getItem({ ledger, entry: 'pk' })
      if (!result || !result.publicKeyArmored) {
        throw new Error(`No public key found for ${ledger}`)
      }
      const ver = Verifier(result.publicKeyArmored)
      if (ledger !== 'system') {
        // check fingerprint
        const fingerprint = await ver.fingerprint()
        if (fingerprint !== ledger) {
          throw new Error(
            `Mismatch between ledger ${ledger} and its public key`
          )
        }
      }
      return ver
    },
    async verifyEntry (entry) {
      // note that this simply throws errors if anything is amis
      const payload = entry.payload
      if (entry.signature) {
        await (await verification.getVerifier(entry.ledger)).verify(
          payload,
          entry.signature
        )
      }
      if (entry.counterSignature) {
        await (await verification.getVerifier(entry.destination)).verify(
          payload,
          entry.counterSignature
        )
      }
    }
  }
  return verification
}

export default verification
