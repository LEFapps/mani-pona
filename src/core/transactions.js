import assert from 'assert'
import sha1 from 'sha1'
import util from 'util'
import { mapValues } from 'lodash'
// import log from 'loglevel'
import { KeyWrapper, Verifier } from '../crypto'
import { shadowEntry, destructure, next, other, flip, isSigned, sortKey, payload } from './tools'

const log = util.debuglog('ManiCore') // activate by adding NODE_DEBUG=ManiCore to environment

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
  log('Getting sources')
  return mapValuesAsync(input, async (ledger, role, input) => {
    const current = await table.getItem({ ledger, entry: '/current' })
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
// used during regular transaction creation
async function getPayloadSources (table, { payloads }) {
  return mapValuesAsync(payloads, async ({ from: { ledger } }, role, payloads) => {
    log(`Getting current on ${role} ${ledger}`)
    return table.getItem({ ledger, entry: '/current' }, `No current entry on ledger ${ledger}`)
  })
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
function addAmount ({ targets: { ledger, destination } }, amount) {
  ledger.amount = amount
  ledger.balance = ledger.balance.add(amount)
  ledger.challenge = payload({ date: ledger.date, from: ledger, to: destination, amount })
  if (ledger.ledger !== 'system' && ledger.balance.value < 0) throw new Error(`Amount not available on ${ledger.ledger}`)
  const complement = amount.multiply(-1)
  destination.amount = complement
  destination.balance = destination.balance.add(complement)
  destination.challenge = payload({ date: ledger.date, from: destination, to: ledger, amount: complement })
  if (destination.ledger !== 'system' && destination.balance.value < 0) throw new Error(`Amount ${complement.format()} not available on ${destination.ledger}`)
  return { ledger, destination }
}
/**
 * Add Demmurage and Income.
 */
function addDI ({ targets: { ledger, destination } }, { demurrage, income }) {
  ledger.demurrage = ledger.balance.multiply(demurrage)
  ledger.income = income
  ledger.amount = ledger.income.subtract(ledger.demurrage)
  ledger.balance = ledger.balance.subtract(ledger.demurrage).add(ledger.income)
  ledger.challenge = payload({ date: ledger.date, from: ledger, to: destination, amount: ledger.amount })
  destination.demurrage = ledger.demurrage.multiply(-1)
  destination.income = ledger.income.multiply(-1)
  destination.amount = destination.demurrage.add(destination.income)
  destination.balance = destination.balance.add(destination.demurrage).add(destination.income)
  destination.challenge = payload({ date: ledger.date, from: destination, to: ledger, amount: destination.amount })
  return { ledger, destination }
}
/**
 * Construct targets from payloads, double-check if matches with source.
 * Used in: create new ledger, sign transaction (initial)
 */
function getPayloadTargets ({ payloads, sources }) {
  return mapValues(payloads, (payload, role, payloads) => {
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
      const matching = await table.getItem({ ledger, entry: `/${date.toISOString()}/${sequence}/${uid}` }) // already made permanent
      if (matching) return matching
      const current = await table.getItem({ ledger, entry: '/current' })
      if (current) {
        assert(date.getTime() === current.date.getTime(), 'Matching dates')
        assert(amount.equals(current.amount), 'Matching amounts')
        return current
      }
      throw new Error(`Matching system entry not found`)
    } else {
      const pending = await table.getItem({ ledger, entry: 'pending' }, `No pending entry found on ledger ${ledger}`)
      assert(date.getTime() === pending.date.getTime(), 'Matching date')
      assert(destination === pending.destination, 'Matching destination')
      assert(sequence === pending.sequence, 'Matching sequence')
      assert(uid === pending.uid, 'Matching uid')
      assert(amount.equals(pending.amount), 'matching amount')
      return pending
    }
  })
}
/**
 * Find the entries preceding the targets.
 */
async function getPendingSources (table, { targets }) {
  return mapValuesAsync(targets, async (target, role, targets) => {
    if (target.ledger !== 'system') {
      const current = await table.getItem({ ledger: target.ledger, entry: '/current' }, `No current entry found on ledger ${target.ledger}`)
      assert(target.uid === current.next, 'Sequential uid')
      assert(target.sequence === current.sequence + 1, 'Sequence')
      return current
    }
    // Note we don't reconstruct sources for system entries as they are necessarily already made permanent
  })
}

function addSignature ({ ledger, destination }, { signature, counterSignature }) {
  ledger.signature = signature
  ledger.next = sha1(signature)
  destination.counterSignature = counterSignature
  return { ledger, destination }
}

async function addSystemSignatures (table, { sources, targets }, keys) {
  // autosigning system side
  // happens during system init, UBI and creation of new ledger
  log(`Autosigning system`)
  assert(targets.destination.ledger === 'system' && targets.ledger.destination === 'system', 'System destination')
  if (!keys) {
    keys = KeyWrapper(await table.getItem({ ledger: 'system', entry: 'pk' }, 'System keys not found'))
  }
  // log(JSON.stringify(targets, null, 2))
  targets.destination.signature = await keys.privateKey.sign(targets.destination.challenge)
  const next = sha1(targets.destination.signature)
  targets.destination.next = next
  if (targets.ledger.ledger === 'system') {
    // system init
    assert(targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init')
    const signature = targets.destination.signature
    targets.ledger.signature = signature
    targets.ledger.counterSignature = signature
    targets.ledger.next = next
    targets.destination.counterSignature = signature
  } else {
    targets.ledger.counterSignature = await keys.privateKey.sign(targets.ledger.challenge)
  }
  return targets
}
/**
 * Add signatures, autosigning system entries.
 * This automatically saves entries.
 */
async function addSignatures (table, { targets }, { ledger, signature, counterSignature, publicKeyArmored }) {
  if (ledger) {
    assert(ledger === targets.ledger.ledger, 'Target ledger')
    if (!publicKeyArmored) {
      ({ publicKeyArmored } = await table.getItem({ ledger, entry: 'pk' }))
      if (!publicKeyArmored) throw new Error(`Unkown ledger ${ledger}`)
    }
    const verifier = Verifier(publicKeyArmored)
    await verifier.verify(targets.ledger.challenge, signature) // throws error if wrong
    await verifier.verify(targets.destination.challenge, counterSignature) // throws error if wrong
    targets = addSignature(targets, { signature, counterSignature })
  }
  return targets
}
/**
 * Transition entries, adding/updating/deleting DB entries where necessarywhere necessary
 */
function transition (table, { source, target }) {
  if (target.entry === 'pending' && isSigned(target)) {
    target.entry = '/current'
    table.putItem(target)
    if (target.ledger !== 'system') {
      table.deleteItem({ ledger: target.ledger, entry: 'pending' })
    }
    if (source && source.entry === '/current') {
      // bump to a permanent state
      source.entry = sortKey(source)
      table.putItem(source)
    }
  } else {
    // no state transition, we just save the target
    table.putItem(target)
  }
}
/**
 * Save the targets, transitioning entry states where relevant.
 */
function saveResults (table, { sources, targets }) {
  if (sources.ledger.ledger !== 'system') { // only happens during system init
    transition(table, { source: sources.ledger, target: targets.ledger })
  } else {
    assert(targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init')
  }
  transition(table, { source: sources.destination, target: targets.destination })
}

export { getSources, getPayloads, getNextTargets,
  addAmount, addDI,
  getPayloadSources, getPayloadTargets,
  getPendingSources, getPendingTargets,
  addSignatures, addSystemSignatures,
  saveResults }
