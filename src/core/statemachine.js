import { getSources, getPayloads, getNextTargets, addAmount,
  getPayloadSources, getPayloadTargets, getPendingTargets, getPendingSources,
  addSignatures, addSystemSignatures, saveResults } from './util'

/**
 * This is the way.
 *
 * Basically this code is to ensure that any manipulations on the ledger(s) are done in the right sequence.
 *
 * (table is actually a core/ledgers object)
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
      async getPayloadSources () {
        context.sources = await getPayloadSources(table, context)
        return Targets(context)
      },
      async continuePending () {
        context.targets = await getPendingTargets(table, context)
        context.sources = await getPendingSources(table, context)
        return Continue(context)
      }
    }
  }
  async function Targets (context) {
    if (context.payloads) {
      return {
        async continuePayload () {
          context.targets = await getPayloadTargets(table, context)
          return Continue(context)
        }
      }
    } else {
      context.targets = await getNextTargets(table, context)
      return {
        async addAmount (amount) {
          context.targets = await addAmount(table, context, amount)
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
      async addMessage (message) {
        context.message = message
        return Continue(context)
      },
      async addNotification (notificationSource) {
        context.notify = notificationSource || context.entry
        return Continue(context)
      },
      async save () {
        saveResults(table, context)
      }
    }
  }
}

export default StateMachine
