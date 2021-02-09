import assert from 'assert'
import { isEmpty, isObject } from 'lodash'
import { KeyWrapper, Verifier } from '../crypto'
import { mani, Mani } from '../mani'
import { shadowEntry, addSignature, continuation, destructure, challenge as convertToChallenge, sortKey } from './tools'
/**
 * This is the way.
 *
 * State diagram (value of 'entry') of source/target (s/t) or ledger/destination (l/d)
 *
 * create:
 *   - addInit: s/t = shadow
 *   - addEntry: s/t = current (error if there is a pending item or missing current)
 *   - addAmount: s/t generates l/d, balance = s/t.balance + amount, error if unavailable,
 *                autosign if system if oroborous -> execute, otherwise -> sign
 * payload: source is pending (UBI or transaction) or destination is pending (transaction)
 *   s: pending (always), t: pending if not-system, current or seq/uid if system
 *   l/d: same as s/t -> sign
 * sign:
 *   - if system -> autosign
 *   - if complete -> to continue, or:
 *   - payload: based on l/d -> exits the state machine
 *   - addSignature: l/d = s/t but can become current, balance is identical to s/t (was already calculated)
 * continue:
 *   - addSignature: only possible on non-system l/d (otherwise it was signed in creation phase)
 * execute:
 * s/t and l/d always available
 * if s/t is current, clobber
 * if s/t is shadow, ignore (
 *
 *
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
  function checkSourceContext (context) {
    checkComplete(context) // check if source and target are defined
    checkAvailable(context.source, context.amount)
    checkAvailable(context.target, context.amount.multiply(-1))
  }
  async function checkNoCurrent (ledger) {
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
        await checkNoCurrent(ledger)
        context[role] = shadowEntry(ledger)
        return Sourcing(context)
      },
      addAmount (amount) {
        context.date = new Date(Date.now())
        context.amount = amount
        checkSourceContext(context)
        const twin = continuation(context)
        return Continuation({ ...context, ...twin })
      }
    }
  }
  async function fromPayload (input) {
    async function reconstructOrigin (entry) {
      const { ledger, uid } = entry
      if (uid === 'init') {
        return shadowEntry(ledger)
      } else {
        // note: payloads are, per definition always pending on users ledgers and current or already archived on the system ledger
        if (ledger === 'system') {
          let target = await table.getItem({ ledger, entry: '/current' })
          if (!target) {
            // it may be an older entry
            target = await table.getItem({ ledger, entry: sortKey(entry) })
          }
          if (!target) { throw new Error(`Expected current item on ledger ${ledger}`) }
          return target
        } else {
          const pending = await table.getItem({ ledger, entry: 'pending' })
          if (!pending) throw new Error(`Expected pending item on ledger ${ledger}`)
          return pending
        }
      }
    }
    function checkMatch (entryA, entryB) {
      // assert(entryA.amount.equals(entryB.amount), 'Matching amounts')
      assert(entryA.ledger === entryB.ledger, 'Matching ledgers')
      assert(entryA.destination === entryB.ledger, 'Matching destination')
      assert(entryA.sequence === entryB.sequence, 'Matching sequence')
      assert(entryA.uid === entryB.uid, 'Matching uid')
      // assert(entryA.date.getTime() === entryB.date.getTime(), 'Matching date')
    }
    function checkReconstruction ({ date, from, to, amount }, { source, target }) {
      checkMatch(from, source)
      checkMatch(to, target)
      assert(date.getTime() === source.date.getTime(), 'Matching timestamps')
    }
    const candidates = destructure(input)
    const context = {
      date: candidates.date,
      source: await reconstructOrigin(candidates.from),
      target: await reconstructOrigin(candidates.to),
      amount: candidates.amount
    }
    checkReconstruction(candidates, context)
    checkSourceContext(context) // check if available balance, etc.
    const twin = continuation(context)
    return { ...context, ...twin }
  }
  async function Continuation (context) {
    // sanity check
    assert(context.date instanceof Date, 'date')
    assert(context.amount instanceof Mani, 'amount')
    assert(isObject(context.ledger), 'ledger')
    assert(isObject(context.destination), 'destination')
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
    function getItems () {
      const items = []
      if (context.source && context.source.entry === '/current' && context.ledger.entry === '/current') {
        // the old current entry is archived
        items.push(permanent(context.source))
      }
      if (context.target && context.target.entry === '/current' && context.destination.entry === '/current') {
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
        // TODO: WRONG! needs to be based on ledger & destination!
        return convertToChallenge(context) // see tools
      },
      async sign (ledger, signature, counterSignature, publicKeyArmored) {
        if (!publicKeyArmored) {
          const pk = await table.getItem({ ledger, entry: 'pk' })
          if (!pk) throw new Error(`Unkown ledger ${ledger}`)
          publicKeyArmored = pk.publicKeyArmored
        }
        const verifier = await Verifier(publicKeyArmored)
        context.ledger = await verifyAndAdd(context.ledger, ledger, signature, verifier)
        context.destination = await verifyAndAdd(context.destination, ledger, counterSignature, verifier)
        return Continuation(context)
      },
      async autosign (keys) {
        console.log(context)
        if (!keys) {
          keys = KeyWrapper(await table.getItem({ ledger: 'system', entry: 'pk' }, 'System keys not found'))
        }
        async function selfsign (entry) {
          const signature = await keys.privateKey.sign(entry.payload)
          entry = addSignature(entry, 'system', signature)
          return entry
        }
        context.ledger = await selfsign(context.ledger)
        context.destination = await selfsign(context.destination)
        return Continuation(context)
      },
      items () {
        return getItems()
      },
      context () {
        return context
      },
      async execute () {
        for (const item of getItems()) { // note that 'for ... of' loops support await, forEach does not
          await table.putItem(item)
        }
      }
    }
  }
  return {
    create: async () => Sourcing({ date: new Date(Date.now()), source: {}, target: {} }),
    payload: async (p) => Continuation(await fromPayload(p))
  }
}

export { Transaction }
