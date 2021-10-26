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
    '^/(?<date>[^/]+)/from(?<from>.+)(?=/to)/to(?<to>.+)(?=/)/(?<amount>[-0-9,ɱ ]+)'
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

/* DEPRECATED
function nextEntry (from, to, date, amount) {
  const entry = {
    ...next(from),
    'entry': 'pending', // ready to be signed
    'sequence': from.sequence + 1,
    'uid': from.next,
    date,
    amount,
    'balance': from.balance.add(amount),
    payload: payload({ date: date, from: next(from), to: next(to), amount: amount })
  }
  return entry
}
*/
/* DEPRECATED
function continuation ({ date, source, target, amount }) { // continue from (previous) transactions
  return {
    date,
    ledger: nextEntry(source, target, date, amount),
    destination: nextEntry(target, source, date, amount),
    amount
  }
} */
/* DEPRECATED
function check (entry) { // superficial integrity check
  assert(isString(entry.ledger), 'ledger')
  assert(entry.entry === '/current', 'current entry')
  assert(isInteger(entry.sequence), 'sequence')
  assert(entry.sequence >= 0, 'sequence must be positive integer')
  assert(isString(entry.next), 'next uid')
  assert(entry.balance instanceof Mani, 'balance')
  return true
}
*/
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
  fixedEncodeURIComponent
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
