import { getSources, getPayloads, getNextTargets, addAmount, addDI,
  getPayloadTargets, getPendingTargets, getPendingSources,
  addSignatures, addSystemSignatures, saveResults } from './transactions'

const log = require('util').debuglog('Transactions')
/**
 * This is the way.
 */
const StateMachine = (table) => {
  const context = {}
  return {
    getPayloads (payload) {
      context.payloads = getPayloads(payload)
      return Sourcing(context)
    },
    async getSources (ledgers) {
      return Sourcing(context).getSources(ledgers)
    }
  }
  function Sourcing (context) {
    return {
      async getSources (ledgers) {
        context.sources = await getSources(table, ledgers)
        return Targets(context)
      },
      async continuePending () {
        context.targets = await getPendingTargets(table, context)
        context.sources = await getPendingSources(table, context)
        // log(JSON.stringify(context, null, 2))
        return Continue(context)
      }
    }
  }
  async function Targets (context) {
    if (context.payloads) {
      return {
        continuePayload () {
          context.targets = getPayloadTargets(context)
          return Continue(context)
        }
      }
    } else {
      context.targets = await getNextTargets(table, context)
      return {
        addAmount (amount) {
          context.targets = addAmount(context, amount)
          return Continue(context)
        },
        addDI (DI) {
          context.targets = addDI(context, DI)
          return Continue(context)
        }
      }
    }
  }
  function Continue (context) {
    return {
      getPrimaryEntry () {
        return context.targets.ledger
      },
      async addSystemSignatures (keys) {
        context.targets = await addSystemSignatures(table, context, keys)
        return Continue(context)
      },
      async addSignatures (signatures) {
        context.targets = await addSignatures(table, context, signatures)
        return Continue(context)
      },
      async save () {
        saveResults(table, context)
      }
    }
  }
}

export default StateMachine
