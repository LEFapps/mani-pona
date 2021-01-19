/**
 * Helper functions that can detect inconsistencies in ledgers and transactions.
 *
 * For transaction signing, the following fields are always used:
 * - chain (chain code)
 * - ledger (fingerprint of ledger public key)
 * - amount (currency formatted)
 * - date (ISO formatted date String or Date)
 */

import assert from 'assert'
import _ from 'lodash'
import mani from './client/currency'

/**
  *
        const { previous, amount, balance, date, destination, proof } = transaction

      previous: '',
      ledger: fingerprint,
      amount: mani(0),
      balance: mani(0),
      date: new Date(),
      destination: fingerprint,
      proof: await newKeys.privateKey.sign({
        chain: '',
        ledger: fingerprint,
        amount: mani(0),
        date: date.toISOString()
      })
      */

// const err = (msg) => `The initial transactions needs to ${msg}`
/*
  input InitialTransaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    balance: Currency!
    date: DateTime!
    proof: String!
  }

        ledger: fingerprint,
        amount: mani(0),
        date: date.toISOString()
 */
const LedgerCheck = (verifier) => {
  return {
    initialTransaction: async (transaction) => {
      assert(!_.isEmpty(transaction), 'No transaction input')
      const fingerprint = await verifier.fingerprint()
      // assert(transaction.amount.equals(0), 'Non-zero amount')
      assert(transaction.balance.equals(0), 'Non-zero balance')
      assert(transaction.ledger === fingerprint, 'Wrong ledger ID')
      // assert(transaction.previous.equals(''), 'Non-empty previous chain code')
      // this may be too problematic to control for as the timestamps are created on the client
      assert(Math.abs(new Date().getTime() - transaction.date.getTime()) < 1000 * 60 * 2, 'Timestamp is off by more than 2 minutes')
      assert(await verifier.verify(
        {
          ledger: fingerprint,
          amount: mani(0),
          date: transaction.date.toISOString()
        }, transaction.proof), 'Transaction proof is incorrect')
    }
  }
}

export { LedgerCheck }
