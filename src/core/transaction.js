import assert from 'assert'
import { isEmpty } from 'lodash'
import { KeyWrapper, Verifier } from '../crypto'
import { mani } from '../mani'
import { shadowEntry, addSignature, continuation, challenge as convertToChallenge, toEntry, sortKey } from './tools'
/**
 * This is the way.
 */
const Transaction = (table) => {
  function checkComplete (context) {
    if (isEmpty(context.source)) throw new Error('No source defined')
    if (isEmpty(context.target)) throw new Error('No target defined')
  }
  function checkAvailable (entry, amount) {
    if (amount.value >= 0) return
    if (entry.ledger === 'system') return
    if (entry.balance.add(amount).negative()) throw new Error(`Amount not available on ledger '${entry.ledger}'`)
  }
  async function checkCurrent (ledger) {
    const current = await table.getItem({ ledger, entry: '/current' })
    if (current) throw new Error(`Ledger '${ledger}' is already initialized`)
  }
  async function getCurrent (ledger) {
    const current = await table.getItem({ ledger, entry: '/current' })
    if (!current) throw new Error(`No current entry on ledger '${ledger}'`)
    return current
  }
  function Sourcing (context) {
    return {
      async addCurrent (role, ledger) {
        assert(role === 'source' || role === 'target')
        context[role] = await getCurrent(ledger)
        return Sourcing(context)
      },
      async addInit (role, ledger) {
        assert(role === 'source' || role === 'target')
        await checkCurrent(ledger)
        context[role] = shadowEntry(ledger)
        return Sourcing(context)
      },
      addAmount (value) {
        checkComplete(context) // check if source and target are defined
        const amount = mani(value)
        checkAvailable(context.source, amount)
        checkAvailable(context.source, amount.multiply(-1))
        context.amount = amount
        return Continuation(context)
      }
    }
  }
  async function Payload (payload) {
    const context = {
      source: toEntry(payload),
      target: toEntry(payload, true) // flipped version
    }
    context.date = context.source.date
    context.amount = context.source.amount
    async function checkIntegrity (entry) {
      if (entry.uid === 'init' && entry.sequence === 0) {
        if (!entry.amount(0)) throw new Error(`Non-zero amount for initial transaction on ledger ${entry.ledger} `)
        checkCurrent(entry.ledger)
      } else if (entry.uid === 'init' || entry.sequence === 0) {
        throw new Error(`Inconsistent init entry on ${entry.ledger}`)
      } else {
        const current = getCurrent(entry.ledger)
        if (entry.sequence !== (current.sequence + 1) || entry.uid !== current.next) {
          throw new Error('Incorrect or outdated challenge, please try again')
        }
      }
    }
    await checkIntegrity(context.source)
    await checkIntegrity(context.target)
    return Continuation(context)
  }
  function Continuation (context) {
    if (!context.ledger) {
      context = {
        ...context,
        ...continuation(context)
      }
    }
    async function verifyAndAdd (entry, ledger, signature, verifier) {
      await verifier.verify(entry.payload, signature)
      entry = addSignature(entry, ledger, signature)
      return entry
    }
    function permanent (entry) {
      return {
        ...entry,
        'entry': sortKey(entry)
      }
    }
    function items () {
      const items = []
      if (context.source.entry === '/current' && context.ledger.entry === '/current') {
        // the old current entry is archived
        items.push(permanent(context.source))
      }
      if (context.target.entry === '/current' && context.destination.entry === '/current') {
        // the old current entry is archived
        items.push(permanent(context.target))
      }
      items.push(context.ledger)
      if (context.destination.ledger !== context.destination.destination) { // skip second Oroborous
        items.push(context.destination)
      }
      return items
    }
    return {
      async challenge () {
        return convertToChallenge(context) // see tools
      },
      async sign (ledger, signature, counterSignature) {
        const pk = await table.getItem({ ledger, entry: 'pk' })
        if (!pk) throw new Error(`Unkown ledger ${ledger}`)
        const verifier = await Verifier(pk.publicKeyArmored)
        context.ledger = verifyAndAdd(context.ledger, ledger, signature, verifier)
        context.destination = verifyAndAdd(context.destination, ledger, counterSignature, verifier)
        return Continuation(context)
      },
      async autosign () {
        const systemKeys = KeyWrapper(await table.getItem({ ledger: 'system', entry: 'pk' }))
        if (!systemKeys) throw new Error('System keys not found.')
        async function sign (entry, keys) {
          const signature = await keys.privateKey.sign(entry.payload)
          entry = addSignature(entry, 'system', signature)
          return entry
        }
        context.ledger = await sign(context.ledger, systemKeys)
        context.destination = await sign(context.destination, systemKeys)
        return Continuation(context)
      },
      simulate () {
        return items()
      },
      async execute () {
        const transaction = table.transaction()
        items().forEach((item) => {
          transaction.putItem(item)
        })
        return transaction.execute()
      }
    }
  }
  return {
    create: async () => Sourcing({ date: new Date(Date.now()), source: {}, target: {}, amount: mani(0) }),
    payload: async (p) => Payload(p)
  }
}

export { Transaction }
