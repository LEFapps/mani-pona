import StateMachine from './statemachine'
import Ledger from '../dynamodb/ledger'
import { flip, destructure, toCSV } from './util'
import { strict as assert } from 'assert'
// import { mani as Ledgers } from './ledgers'

import { getLogger } from 'server-log'
const log = getLogger('core:transactions')

/**
 * Operations on a single ledger.
 */
export default (ledgers, fingerprint) => {
  const ledger = Ledger(ledgers, fingerprint)
  const { available, current, pending, recent, short } = ledger
  return {
    fingerprint,
    available,
    current,
    pending,
    recent,
    short,
    async challenge (destination, amount) {
      if (destination === 'system') { throw new Error('Nice try.') }
      return StateMachine(ledgers)
        .getSources({ ledger: fingerprint, destination })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async create (proof, message = '-', prepaid = false) {
      const { from: { ledger: from }, to: { ledger: to } } = destructure(proof.payload)
      assert.equal(from, fingerprint) // sanity check
      if (to === 'system') { throw new Error('Nice try.') }
      const existing = await ledger.pending()
      if (existing) {
        if (existing.challenge === proof.payload) {
          log.info(`Transaction ${proof.payload} was already created`)
          return existing // idempotency
        } else {
          throw new Error('There is already a (different) pending transaction on this ledger.')
        }
      }
      try {
        const transaction = ledgers.transaction()
        await StateMachine(transaction)
          .getPayloads(proof.payload)
          .getPayloadSources()
          .then(t => t.continuePayload())
          .then(t => t.addSignatures({ ledger: fingerprint, ...proof }))
          .then(t => t.addMessage(message))
          .then(t => t.save())
        await transaction.execute()
        if (prepaid) {
          log.info('Autosigning transaction on prepaid account:\n%s', proof.payload)
          const keys = await ledgers.keys(to, true)
          const { publicKeyArmored } = keys
          if (!keys.privateKeyArmored) { throw new Error('Account is not a prepaid account') }
          const pending = await ledgers.pending(to, true) // throws error if not found
          const { challenge } = pending
          const signature = await keys.privateKey.sign(challenge)
          const counterSignature = await keys.privateKey.sign(flip(challenge))
          const transaction = ledgers.transaction()
          await StateMachine(transaction)
            .getPayloads(challenge)
            .continuePending()
            .then(t => t.addSignatures({ ledger: to, signature, counterSignature, publicKeyArmored }))
            .then(t => t.save())
          await transaction.execute()
          return ledger.current() // we could do some double checking here
        } else {
          return ledger.pending()
        }
      } catch (err) {
        log.error('Error while creating transaction: %s\n%s', err, err.stack)
        throw new Error('Error while creating transaction, please check logs.')
      }
    },
    async confirm (proof) {
      // proof contains signature, counterSignature, payload
      const existing = await ledger.current()
      if (existing && existing.challenge === proof.payload) {
        log.info(`Transaction ${proof.payload} was already confirmed`)
        return existing.next // idempotency
      }
      let next
      const transaction = ledgers.transaction()
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .continuePending()
        .then(t => t.addSignatures({ ledger: fingerprint, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next
          log.debug('Primary entry: %j', t.getPrimaryEntry())
          return t
        })
        .then(t => t.save())
      await transaction.execute()
      return next
    },
    async cancel (challenge) {
      const pending = await ledger.pending()
      if (pending && pending.challenge === challenge) {
        if (pending.destination === 'system') {
          throw new Error('System transactions cannot be cancelled.')
        }
        const destination = await ledgers.pendingEntry(pending.destination)
        if (!destination) {
          throw new Error(
            'No matching transaction found on destination ledger, please contact system administrators.'
          )
        }
        const transaction = ledgers.transaction()
        transaction.deletePending(fingerprint)
        transaction.deletePending(pending.destination)
        await transaction.execute()
        return 'Pending transaction successfully cancelled.'
      } else {
        return 'No matching pending transaction found, it may have already been cancelled or confirmed.'
      }
    },
    async export () {
      const atts = ledgers.shortAttributes()
      const items = await ledger.export()
      return toCSV(atts, items)
    }
  }
}
