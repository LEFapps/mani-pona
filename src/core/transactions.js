import StateMachine from './statemachine'
import Ledger from '../dynamodb/ledger'
import { toCSV } from './util'
// import { mani as Ledgers } from './ledgers'

import { getLogger } from 'server-log'
const log = getLogger('core:transactions')

/**
 * Operations on a single ledger.
 */
export default (ledgers, fingerprint) => {
  const ledger = Ledger(ledgers, fingerprint)
  const { current, pending, recent, short } = ledger
  return {
    fingerprint,
    current,
    pending,
    recent,
    short,
    async challenge (destination, amount) {
      return StateMachine(ledgers)
        .getSources({ ledger: fingerprint, destination })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async create (proof, message = '-') {
      const existing = await ledger.pending()
      if (existing && existing.challenge === proof.payload) {
        log.info(`Transaction ${proof.payload} was already created`)
        return existing.next // idempotency
      }
      let next
      const transaction = ledgers.transaction()
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .getPayloadSources()
        .then(t => t.continuePayload())
        .then(t => t.addSignatures({ ledger: fingerprint, ...proof }))
        .then(t => t.addMessage(message))
        .then(t => {
          next = t.getPrimaryEntry().next
          return t
        })
        .then(t => t.save())
      await transaction.execute()
      return next
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
