import assert from 'assert'
import sha1 from 'sha1'
// import log from 'loglevel'
import { KeyWrapper, Verifier } from '../../client/shared/crypto'
import {
  shadowEntry,
  destructure,
  next,
  other,
  flip,
  isSigned,
  sortKey,
  payload
} from '../../client/shared/tools'
import { getLogger } from 'server-log'
import identity from 'lodash/identity'

const log = getLogger('core:util')
/**
 * Note that the 'table' listed below should always be a core/ledgerTable object
 */
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
  log.debug('Getting sources for %j', input)
  return mapValuesAsync(input, async (ledger, role, input) => {
    const current = await table.current(ledger)
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
  return mapValuesAsync(
    payloads,
    async ({ from: { ledger } }, role, payloads) => {
      log.debug('Getting current on %s %s', role, ledger)
      return table.current(ledger, true)
    }
  )
}

/**
 * Get 'next' target (pending) entries.
 * There should be no pending items in the DB.
 * Used for: system init, create new ledger challenge, create transaction challenge and basic income
 */
async function getNextTargets (table, { sources }) {
  const date = new Date(Date.now())
  return mapValuesAsync(sources, async (source, role, sources) => {
    if (source.ledger !== 'system') {
      // the system ledger never has pending items
      const pending = await table.pending(source.ledger)
      if (pending) {
        throw new Error(
          `Ledger ${
            source.ledger
          } already has a pending entry: ${JSON.stringify(pending)}`
        )
      }
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
async function addAmount (
  ledgers,
  { targets: { ledger, destination } },
  amount
) {
  ledger.amount = amount
  ledger.challenge = payload({
    date: ledger.date,
    from: ledger,
    to: destination,
    amount
  })
  if (ledger.ledger === 'system') {
    ledger.balance = ledger.balance.add(amount)
  } else {
    const { balance, income, demurrage, remainder } = await ledgers.available(
      ledger.ledger
    )
    ledger.balance = balance.add(amount)
    ledger.income = income
    ledger.demurrage = demurrage
    ledger.remainder = remainder
    if (ledger.balance.value < 0) {
      throw new Error(`Amount not available on ${ledger.ledger}`)
    }
  }
  const complement = amount.multiply(-1)
  destination.amount = complement
  destination.balance = destination.balance.add(complement)
  destination.challenge = payload({
    date: ledger.date,
    from: destination,
    to: ledger,
    amount: complement
  })
  if (destination.ledger === 'system') {
    destination.balance = destination.balance.add(amount)
  } else {
    const { balance, income, demurrage, remainder } = await ledgers.available(
      destination.ledger
    )
    destination.balance = balance.add(complement)
    destination.income = income
    destination.demurrage = demurrage
    destination.remainder = remainder
    if (destination.balance.value < 0) {
      throw new Error(`Amount not available on ${ledger.ledger}`)
    }
  }
  return { ledger, destination }
}
/**
 * Construct targets from payloads, double-check if matches with source.
 * Used in: create new ledger, sign transaction (initial)
 */
async function getPayloadTargets (ledgers, { payloads, sources }) {
  return mapValuesAsync(payloads, async (payload, role, payloads) => {
    const {
      date,
      from: { ledger, sequence, uid },
      to: { ledger: destination },
      challenge,
      amount
    } = payload
    const { sequence: sourceSequence, next } = sources[role]
    assert(sequence === sourceSequence + 1, 'Matching sequence')
    assert(uid === next, 'Matching next uid')
    const { balance, income, demurrage, remainder } = await ledgers.available(
      ledger
    )
    // TODO: we could recheck here if non-system ledgers don't end up below zero
    // however, it would difficult to get a valid challenge under those conditions
    return {
      ledger,
      entry: 'pending',
      date,
      sequence,
      uid,
      destination,
      amount,
      balance: balance.add(amount),
      income,
      demurrage,
      remainder,
      challenge
    }
  })
}
/**
 * Get pending items from DB, check if it matches the payload.
 */
async function getPendingTargets (table, { payloads }) {
  return mapValuesAsync(payloads, async (payload, role, payloads) => {
    const {
      date,
      from: { ledger, sequence, uid },
      to: { ledger: destination },
      amount
    } = payload
    if (ledger === 'system') {
      const matching = await table.entry(
        ledger,
        sortKey({ date, sequence, uid })
      ) // already made permanent
      if (matching) return matching
      const current = await table.current(ledger)
      if (current) {
        assert(
          date.getTime() === current.date.getTime(),
          `Dates do not match: ${date.toISOString()} vs ${current.date.toISOString()}`
        )
        assert(
          amount.equals(current.amount),
          `Amounts do not match: ${amount.format()} vs ${current.amount.format()}`
        )
        return current
      }
      throw new Error(`Matching system entry not found`)
    } else {
      const pending = await table.pending(ledger, true)
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
      const current = await table.current(target.ledger, true)
      assert(target.uid === current.next, 'Sequential uid')
      assert(target.sequence === current.sequence + 1, 'Sequence')
      return current
    }
    // Note we don't reconstruct sources for system entries as they are necessarily already made permanent
  })
}

async function signTransaction (transaction, ledger, keys) {
  if (transaction.ledger === ledger) {
    transaction.signature = await keys.privateKey.sign(transaction.challenge)
    transaction.next = sha1(transaction.signature)
    log.debug(
      'Added automatic signature and next token to transaction for %s',
      ledger
    )
  }
  if (transaction.destination === ledger) {
    transaction.counterSignature = await keys.privateKey.sign(
      transaction.challenge
    )
    log.debug('Added automatic counter-signature to transaction for %s', ledger)
  }
  return transaction
}

async function autoSign (table, { sources, targets }, ledger, keys) {
  // autosigning targets with stored (or recently created) keys
  // happens during system init, UBI and creation of new ledger
  log.info('Autosigning with %s', ledger)
  assert(
    targets.destination.ledger === ledger ||
      targets.ledger.destination === ledger,
    'Autosigning ledger does not match target(s)'
  )
  if (!keys) {
    keys = KeyWrapper(await table.keys(ledger, true))
    if (!keys.privateKey) {
      throw new Error(`No private key found on ${ledger}`)
    }
  }
  log.debug('Signing targets %j', targets)
  targets.ledger = await signTransaction(targets.ledger, ledger, keys)
  targets.destination = await signTransaction(targets.destination, ledger, keys)
  return targets
}
/**
 * Verify and add signatures.
 */
async function addSignatures (
  table,
  { targets },
  { ledger, signature, counterSignature, publicKeyArmored }
) {
  if (ledger) {
    assert(ledger === targets.ledger.ledger, 'Target ledger does not match')
    if (!publicKeyArmored) {
      ;({ publicKeyArmored } = await table.keys(ledger, true))
      if (!publicKeyArmored) throw new Error(`Missing PK:  ${ledger}`)
    }
    const verifier = Verifier(publicKeyArmored)
    await verifier.verify(targets.ledger.challenge, signature) // throws error if wrong
    await verifier.verify(targets.destination.challenge, counterSignature) // throws error if wrong
    targets.ledger.signature = signature
    targets.ledger.next = sha1(signature)
    targets.destination.counterSignature = counterSignature
  }
  return targets
}
/**
 * Transition entries, adding/updating/deleting DB entries where necessarywhere necessary
 */
function transition (table, { source, target, message, notify }) {
  if (notify) target.notify = notify
  if (target.entry === 'pending' && isSigned(target)) {
    target.entry = '/current'
    table.putEntry(target)
    if (target.ledger !== 'system') {
      table.deletePending(target.ledger)
    }
    if (source && source.entry === '/current') {
      // bump to a permanent state
      source.entry = sortKey(source)
      table.putEntry(source)
    }
  } else {
    // no state transition, we just save the target
    target.message = message
    table.putEntry(target)
  }
}
/**
 * Save the targets, transitioning entry states where relevant.
 */
function saveResults (table, { sources, targets, message, notify }) {
  transition(table, { source: sources.ledger, target: targets.ledger, message })
  // unless the transaction is an oroborous, we also save the destination
  // note that this automatically means that the amount must be 0
  if (targets.destination.challenge !== targets.ledger.challenge) {
    transition(table, {
      source: sources.destination,
      target: targets.destination,
      message
    })
  }
}
/**
 * Convert items (Objects) to one big CSV string.
 **/
function toCSV (attributes, items, translator = identity) {
  const output = []
  output.push(attributes.map(translator).join(';'))
  items.forEach(item => {
    const values = attributes.reduce((acc, att) => {
      log.debug('Getting %s from %j', att, item)
      let value = item[att] || ''
      acc.push(value)
      return acc
    }, [])
    output.push(values.join(';'))
  })
  return output.join('\n')
}

export {
  getSources,
  getPayloads,
  getNextTargets,
  addAmount,
  getPayloadSources,
  getPayloadTargets,
  getPendingSources,
  getPendingTargets,
  addSignatures,
  autoSign,
  saveResults,
  flip,
  destructure,
  toCSV
}
