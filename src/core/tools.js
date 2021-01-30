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
  first () {
    const date = new Date()
    const entry = {
      'ledger': 'system',
      'entry': '/current',
      'sequence': 0,
      'date': date,
      'uid': 'init', // there is nothing before this entry
      'message': 'tenpo suno pona',
      'balance': new Mani(0)
    }
    entry.payload = `/${entry.date.toISOString()}${tools.path(entry)}/${entry.balance.format()}`
    return entry
  },
  addPrimarySignature (entry, signature) {
    return {
      ...entry,
      next: signature.hash,
      signature: signature.signature
    }
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
      entry.payload = `/${entry.date.toISOString()}/from${tools.path(entry)}/to${tools.path(other)}`
    })
    if (amount) {
      tools.addAmounts(twin, amount)
    }
    return twin
  },
  addAmounts (twin, amount) {
    tools.addAmount(twin.ledger, amount)
    tools.addAmount(twin.destination, amount.multiply(-1))
  },
  addAmount (entry, amount) {
    entry.amount = amount
    entry.balance = entry.balance.add(amount)
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
