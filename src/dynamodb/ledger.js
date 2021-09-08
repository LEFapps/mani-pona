import { getLogger } from 'server-log'
const log = getLogger('dynamodb:ledger')
/**
 * Specialized view on a single ledger.
 */

function ledger (ledgers, fingerprint) {
  return {
    fingerprint,
    async current (required = false) {
      return ledgers.current(fingerprint, required)
    },
    async pending (required = false) {
      return ledgers.pending(fingerprint, required)
    },
    async recent () {
      return ledgers.recent(fingerprint)
    },
    async entry (entry, required = false) {
      return ledgers.entry(fingerprint, entry, required)
    },
    short () {
      return ledger(ledgers.short(), fingerprint)
    }
  }
}

export default ledger
