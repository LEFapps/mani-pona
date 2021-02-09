import assert from 'assert'
import sha1 from 'sha1'
// import log from 'loglevel'
import { KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, destructure, next, other, flip, fromDb, isSigned, sortKey } from './tools'

async function mapValuesAsync (object, asyncFn) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(object).map(async ([key, value]) => [
        key,
        await asyncFn(value, key, object)
      ])
    )
  )
}

/**
 * Create context.source:
 * if no /current, return shadow
 *
 * Sample input:
 *  - ledger: '<fingerprint>'
 *  - destination: 'system'
 */
async function getSources (table, input) {
  return mapValuesAsync(input, async (ledger, role, input) => {
    const current = fromDb(await table.getItem({ ledger, entry: '/current' }))
    if (current) return current
    return shadowEntry(ledger)
  })
}

function getPayloads (payload) {
  return {
    ledger: { ...destructure(payload), challenge: payload },
    destination: { ...destructure(payload, true), challenge: flip(payload) }
  }
}
/**
 * Get 'next' target (pending) entries.
 * There should be no pending items in the DB.
 * Used for: system init, create new ledger challenge, create transaction challenge and basic income
 */
async function getNextTargets (table, { sources }) {
  const date = new Date(Date.now())
  return mapValuesAsync(sources, async (source, role, sources) => {
    if (source.ledger !== 'system') { // the system ledger never has pending items
      const pending = await table.getItem({ ledger: source.ledger, entry: 'pending' })
      if (pending) throw new Error(`Ledger ${source.ledger} already has a pending entry`)
    }
    return {
      ...next(source),
      entry: 'pending',
      sequence: source.sequence + 1,
      uid: source.next,
      date,
      balance: source.balance,
      destination: sources[other(role)].ledger
    }
  })
}
/**
 * Add amount to targets.
 */
async function addAmount ({ targets: { ledger, destination } }, amount) {
  ledger.amount = amount
  ledger.balance = ledger.balance.add(amount)
  if (ledger.ledger !== 'system' && ledger.balance.value < 0) throw new Error(`Amount not available`)
  destination.amount = amount.multiply(-1)
  destination.balance = destination.balance.add(amount.multiply(-1))
  if (destination.ledger !== 'system' && destination.balance.value < 0) throw new Error(`Amount not available`)
  return { ledger, destination }
}
/**
 * Add Demmurage and Income.
 */
async function addDI ({ targets: { ledger, destination } }, { demurrage, income }) {
  demurrage = demurrage < 0 ? demurrage : demurrage * -1 // make sure the sign is negative
  ledger.demurrage = ledger.balance.multiply(demurrage)
  ledger.income = income
  ledger.amount = ledger.demurrage.add(ledger.income)
  ledger.balance = ledger.balance.add(ledger.demurrage).add(ledger.income)
  destination.demurrage = ledger.demurrage.multiply(-1)
  destination.income = ledger.income.multiply(-1)
  destination.amount = destination.demurrage.add(destination.income)
  destination.balance = destination.balance.add(destination.demurrage).add(destination.income)
  return { ledger, destination }
}
/**
 * Construct targets from payloads, double-check if matches with source.
 * Used in: create new ledger, sign transaction (initial)
 */
function getPayloadTargets ({ payloads, sources }) {
  return mapValuesAsync(payloads, async (payload, role, payloads) => {
    const { date, from: { ledger, sequence, uid }, to: { ledger: destination }, challenge, amount } = payload
    const { sequence: sourceSequence, next, balance } = sources[role]
    assert(sequence === (sourceSequence + 1), 'Matching sequence')
    assert(uid === next, 'Matching next uid')
    return {
      ledger,
      entry: 'pending',
      date,
      sequence,
      uid,
      destination,
      amount,
      balance: balance.add(amount),
      challenge
    }
  })
}
/**
 * Get pending items from DB, check if it matches the payload.
 */
async function getPendingTargets (table, { payloads }) {
  return mapValuesAsync(payloads, async (payload, role, payloads) => {
    const { date, from: { ledger, sequence, uid }, to: { ledger: destination }, amount } = payload
    if (ledger === 'system') {
      const matching = fromDb(await table.getItem({ ledger, entry: `/${date.toISOString()}/${sequence}/${uid}` })) // already made permanent
      if (matching) return matching
      const current = fromDb(await table.getItem({ ledger, entry: '/current' }))
      if (current) {
        assert(date.getTime() === current.date.getTime(), 'Matching dates')
        assert(amount.equals(current.amount), 'Matching amounts')
        return current
      }
      throw new Error(`Matching system entry not found`)
    } else {
      const pending = fromDb(await table.getItem({ ledger, entry: 'pending' }))
      if (!pending) throw new Error(`No pending entry found on ledger ${ledger}`)
      assert(date.getTime() === pending.date.getTime(), 'Matching date')
      assert(destination === pending.destination, 'Matching destination')
      assert(sequence === pending.sequence, 'Matching sequence')
      assert(uid === pending.uid, 'Matching uid')
      assert(amount.equals(pending.amount), 'matching amount')
      return pending
    }
  })
}
function addSignature ({ ledger, destination }, { signature, counterSignature }) {
  ledger.signature = signature
  ledger.next = sha1(signature)
  ledger.counterSignature = counterSignature
  return { ledger, destination }
}
/**
 * Add signatures, autosigning system entries.
 * This automatically saves entries.
 */
async function addSignatures (table, { sources, targets }, { ledger, signature, counterSignature, publicKeyArmored }) {
  if (targets.destination.ledger === 'system') {
    // autosigning system side
    // happens during system init, UBI and creation of new ledger
    const systemKeys = KeyWrapper(await table.getItem({ ledger: 'system', entry: 'pk' }, 'System keys not found'))
    const signature = await systemKeys.privateKey.sign(targets.target.challenge) // Attention: We are reverse signing here!
    const counterSignature = await systemKeys.privateKey.sign(targets.destination.challenge)
    targets = addSignature(targets, { signature, counterSignature })
    if (targets.ledger.ledger === 'system') {
      // system init
      assert(targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init')
      targets = addSignature(targets, { signature: counterSignature, counterSignature: signature })
    }
  }
  if (ledger) {
    assert(ledger === targets.ledger.ledger, 'Target ledger')
    if (!publicKeyArmored) {
      const pk = await table.getItem({ ledger, entry: 'pk' })
      if (!pk) throw new Error(`Unkown ledger ${ledger}`)
      publicKeyArmored = pk.publicKeyArmored
    }
    const verifier = await Verifier(publicKeyArmored)
    await verifier.verify(targets.ledger.challenge, signature) // throws error if wrong
    await verifier.verify(targets.destination.challenge, counterSignature) // throws error if wrong
    targets = addSignature(targets, { signature, counterSignature })
  }
  return saveResults(table, { sources, targets })
}
/**
 * Transition entries, adding/updating/deleting DB entries where necessarywhere necessary
 */
function transition (transaction, { source, target }) {
  if (target.entry === 'pending' && isSigned(target)) {
    target.entry = '/current'
    transition.putItem(target)
    transition.deleteItem({ ledger: target.ledger, entry: 'pending' })
    if (source.entry === '/current') {
      // bump to a permanent state
      source.entry = sortKey(source)
      transition.putItem(source)
    }
  } else {
    // no state transition, we just save the target
    transition.putItem(target)
  }
}
/**
 * Save the targets, transitioning entry states where relevant.
 */
async function saveResults (table, { sources, targets }) {
  const transaction = table.transaction()
  if (sources.ledger.ledger !== 'system') { // only happens during system init
    transition(transaction, { source: sources.ledger, target: targets.ledger })
  } else {
    assert(targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init')
  }
  transition(transaction, { source: sources.destination, target: targets.destination })
  console.log(JSON.stringify(transaction.items(), null, 2))
  // await transaction.execute()
}

export { getSources, getPayloads, getNextTargets, addAmount, addDI, getPayloadTargets, getPendingTargets, addSignatures }
