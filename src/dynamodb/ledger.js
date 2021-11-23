import { getLogger } from 'server-log'
const log = getLogger('dynamodb:ledger')
/**
 * Specialized view on a single ledger.
 */

function ledger (ledgers, fingerprint) {
  return {
    fingerprint,
    async notifications () {
      return ledgers.notifications(fingerprint)
    },
    async current (required = false) {
      return ledgers.current(fingerprint, required)
    },
    async pending (required = false) {
      return ledgers.pending(fingerprint, required)
    },
    async recent () {
      return ledgers.recent(fingerprint)
    },
    /**
    * Check if the amount is available on this ledger, using a projected balance (on the specified datetime).
    * Returns true or false.
    */
    async checkAvailable (amount, date) {
      return ledgers.checkAvailable(fingerprint, amount, date)
    },
    /**
     * Get the projected balance for this ledger.
     */
    async available (now = new Date()) {
      return ledgers.available(fingerprint, now)
    },
    async entry (entry, required = false) {
      return ledgers.entry(fingerprint, entry, required)
    },
    async export () {
      return ledgers.exportLedger(fingerprint)
    },
    short () {
      return ledger(ledgers.short(), fingerprint)
    }
  }
}

export default ledger
