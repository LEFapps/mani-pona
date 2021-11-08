import { isString, isArray, isDate, mapValues, map, get } from 'lodash'
import assert from 'assert'
import sha1 from 'sha1'
import { Mani } from './mani'
/**
 * In many ways, this is the heart of the system. Thread carefully.
 */

function pad (i) {
  return ('000000000000' + i).slice(-12)
}
function other (party) {
  return party === 'ledger' ? 'destination' : 'ledger'
}
function entryPath (entry) {
  return `/${pad(entry.sequence)}/${entry.uid}`
}
function path (entry) {
  return `/${entry.ledger}${entryPath(entry)}`
}
function sortKey (entry) {
  return `/${entry.date.toISOString()}${entryPath(entry)}`
}
function destructurePath (path) {
  const match = new RegExp(
    '/(?<ledger>[a-z0-9]+)/(?<sequence>[0-9]+)/(?<uid>[a-z0-9]+)'
  ).exec(path)
  if (!match) {
    throw new Error('invalid path')
  }
  let { ledger, sequence, uid } = match.groups
  sequence = parseInt(sequence)
  return { ledger, sequence, uid }
}
function destructure (payload, flip = false) {
  const full =
    '^/(?<date>[^/]+)/from(?<from>.+)(?=/to)/to(?<to>.+)(?=/)/(?<amount>[-0-9.,ɱ ]+)'
  let match = new RegExp(full).exec(payload)
  if (match) {
    let { date, from, to, amount } = match.groups
    date = new Date(date)
    from = destructurePath(from)
    to = destructurePath(to)
    amount = new Mani(amount)
    if (flip) {
      return { date, from: to, to: from, amount: amount.multiply(-1) }
    }
    return { date, from, to, amount }
  }
  throw new Error('invalid payload')
}
function toEntry (pl, flip = false) {
  const { date, from, to, amount } = destructure(pl, flip)
  const { ledger, sequence, uid } = from
  if (flip) {
    pl = payload({ date, from, to, amount })
  }
  return {
    date,
    ledger,
    entry: 'pending',
    sequence,
    uid,
    destination: to.ledger,
    payload: pl,
    amount
  }
}
function flip (pl) {
  return payload(destructure(pl, true))
}
function payload ({ date, from, to, amount }) {
  let payload = `/${date.toISOString()}/from${path(from)}/to${path(to)}`
  if (amount) {
    payload = payload + `/${amount.format()}`
  }
  return payload
}
function shadowEntry (ledger) {
  // this is the "shadow entry" that sits right before the first entry on a ledger
  return {
    ledger,
    entry: 'shadow',
    sequence: -1,
    next: 'init', // there is nothing before this entry
    balance: new Mani(0)
  }
}
function addSignature (entry, ledger, signature) {
  assert(isString(signature), 'signature')
  const result = { ...entry } // cheap clone
  if (entry.ledger === ledger) {
    result.next = sha1(signature)
    result.signature = signature
  }
  if (entry.destination === ledger) {
    result.counterSignature = signature
  }
  if (entry.entry === 'pending' && isSigned(result)) {
    result.entry = '/current'
  }
  return result
}
function toDb (entry) {
  return mapValues(entry, value => {
    if (value instanceof Mani) {
      return value.format()
    }
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  })
}
function fromDb (entry) {
  if (!entry) {
    return undefined
  }
  if (isArray(entry)) {
    return map(entry, fromDb)
  }
  return mapValues(entry, (value, key) => {
    if (key === 'date') {
      return new Date(value)
    }
    if (
      (key === 'amount' ||
        key === 'balance' ||
        key === 'income' ||
        key === 'buffer') &&
      isString(value)
    ) {
      return new Mani(value)
    }
    if (key === 'demurrage' && isString(value)) {
      return new Mani(value)
    }
    return value
  })
}
function isSigned (entry) {
  if (isString(entry.signature) && entry.ledger === 'system') return true // system entries don't require counterSignatures!
  if (!isString(entry.signature) || !isString(entry.counterSignature)) {
    return false
  }
  return true
}
function next ({ ledger, sequence, next }) {
  return {
    ledger,
    sequence: sequence + 1,
    uid: next
  }
}
function challenge ({ date, source, target, amount }) {
  return payload({ date, from: next(source), to: next(target), amount })
}
const sortBy = (property, direction = 'ASC') => {
  return (a, b) => {
    let aa = get(a, property, 0)
    let bb = get(b, property, 0)
    if (isDate(aa)) aa = aa.valueOf()
    if (isDate(bb)) bb = bb.valueOf()
    if (direction === 'ASC') return aa - bb
    return bb - aa
  }
}
function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16)
  })
}
/**
 * Calculates the 'virtual balance', based on the current transaction (balance and date) and user parameters (buffer, income and demurrage).
 * The 'unit' represents the time interval over which the parameters are set (current one month), in seconds.
 *
 * Note that the calculation is mostly done in manicents, so we can work strictly with integers. There is also a remainder,
 * which should be stored in the database, but not shown to the user. This remainder keeps track of amounts that would be lost
 * during the rounding, resulting in (possibly severe) underestimations of the demurrage.
 *
 * The default unit is 30 days, this could be made more precise by using e.g. one day or week as unit.
 */
// const log = require('util').debuglog('sumsy:redeem')
const log = () => {}
function redeem ({ balance, date, remainder = 0 }, { income, buffer, demurrage }, { unit = 1000 * 60 * 60 * 24 * 30, now = new Date() }) {
  const interval = now.getTime() - date.getTime()
  log('Interval %d out of unit %d, ratio %d', interval, unit, interval / unit)
  const cutoff = unit // one manicent is the cut-off, which we denormalise with the unit to get a big number instead of fractions
  log('Cut-off %d', cutoff)
  let demurrageTaken = 0
  let incomeGranted = 0
  // step 1: calculate demurrage on anything not protected by the buffer
  if (demurrage !== 0) {
    log('Calculating demurrage %d', demurrage)
    const unbufferedBalance = balance.subtract(buffer)
    log('Unbuffered balance %s', unbufferedBalance)
    if (unbufferedBalance.value > 0) {
      log('Interval %d', interval)
      if (interval < 0) return { balance, date: now, remainder } // we shouldn't throw an error here, because it might just be a client that has a bad clock
      const scope = unbufferedBalance.intValue * interval * demurrage * 0.01 + remainder // manicent-milliseconds, kind of like kWh
      log('Demurrage scope %d', scope)
      demurrageTaken = Math.floor(scope / cutoff) / 100 // renormalize
      log('Demurrage: %d', demurrageTaken)
      balance = balance.subtract(demurrageTaken)
      remainder = 0 - (scope % cutoff) // this may look weird, but it avoids accidentally ending up with a negative zero
      log('Remainder after demurrage: %d', remainder)
    }
  }
  // step 2: add income, if available
  if (!income.zero()) {
    const scope = income.intValue * interval + remainder
    log('Income scope %d', scope)
    incomeGranted = Math.floor(scope / cutoff) / 100 // renormalize
    log('Income: %d', incomeGranted)
    balance = balance.add(incomeGranted)
    remainder = scope % cutoff
    log('Remainder after income: %d (%d MOD %d)', remainder, scope, cutoff)
  }
  return { balance, date: now, remainder, demurrage: new Mani(demurrageTaken), income: new Mani(incomeGranted) }
}

const DEFAULT_BALANCE = {
  balance: new Mani(0),
  demurrage: new Mani(0),
  income: new Mani(0),
  remainder: 0
}

export {
  pad,
  other,
  shadowEntry,
  addSignature,
  toDb,
  fromDb,
  isSigned,
  next,
  payload,
  destructure,
  destructurePath,
  challenge,
  toEntry,
  sortKey,
  sortBy,
  flip,
  fixedEncodeURIComponent,
  redeem,
  DEFAULT_BALANCE
}

const tools = {
  pad,
  other,
  shadowEntry,
  addSignature,
  toDb,
  fromDb,
  isSigned,
  next,
  payload,
  destructure,
  destructurePath,
  challenge,
  toEntry,
  sortKey,
  sortBy,
  flip,
  fixedEncodeURIComponent
}

export default tools
