import { forEach, isString, isInteger, mapValues } from 'lodash'
import assert from 'assert'
import { Mani } from '../mani'
/**
 * In many ways, this is the heart of the system. Thread carefully.
 */
const tools = {
  pad (i) {
    return ('000000000000' + i).slice(-12)
  },
  other (party) { return party === 'ledger' ? 'destination' : 'ledger' },
  path (entry) { return `/${entry.ledger}/${tools.pad(entry.sequence)}/${entry.uid}` },
  shadowEntry (ledger) {
    // this is the "shadow entry" that sits right before the first entry on a ledger
    return {
      ledger,
      'sequence': -1,
      'next': 'init', // there is nothing before this entry
      'balance': new Mani(0)
    }
  },
  addSignature (entry, ledger, signature) {
    const result = { ...entry }
    if (entry.ledger === ledger) {
      result.next = signature.hash
      result.signature = signature.signature
    }
    if (entry.destination === ledger) {
      result.counterSignature = signature.signature
    }
    return result
  },
  toDb (entry) {
    return mapValues(entry, (value) => {
      if (value instanceof Mani) {
        return value.format()
      }
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    })
  },
  next (previous, date) {
    const entry = {
      'ledger': previous.ledger,
      'entry': 'pending', // ready to be signed
      'sequence': previous.sequence + 1,
      'uid': previous.next,
      'date': date,
      'balance': previous.balance // note that is a 'working' balance, so subject to change!
    }
    return entry
  },
  continuation (source, target, amount) { // continue from (previous) transactions
    const date = new Date(Date.now()) // easier to mock
    const twin = {
      'ledger': tools.next(source, date),
      'destination': tools.next(target, date)
    }
    // add cross references:
    forEach(twin, (entry, party, twin) => {
      const other = twin[tools.other(party)]
      entry.destination = other.ledger
      entry.payload = `/${entry.date.toISOString()}/from${tools.path(twin.ledger)}/to${tools.path(twin.destination)}`
    })
    if (amount) {
      tools.addAmounts(twin, amount)
    }
    return twin
  },
  addAmounts (twin, amount) {
    tools.addAmount(twin.ledger, amount)
    tools.addAmount(twin.destination, amount, -1)
  },
  addAmount (entry, amount, sign = 1) {
    entry.amount = amount
    entry.balance = entry.balance.add(amount).multiply(sign)
    entry.payload = `${entry.payload}/${amount.format()}`
  },
  check (entry) { // superficial integrity check
    assert(isString(entry.ledger), 'ledger')
    assert(entry.entry === '/current', 'current entry')
    assert(isInteger(entry.sequence), 'sequence')
    assert(entry.sequence >= 0, 'sequence must be positive integer')
    assert(isString(entry.next), 'next uid')
    assert(entry.balance instanceof Mani, 'balance')
    return true
  }
}

export default tools
