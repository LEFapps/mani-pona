'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var apolloServerLambda = require('apollo-server-lambda');
var dynamoPlus = require('dynamo-plus');
var log$2 = require('loglevel');
var _ = require('lodash');
var assert = require('assert');
var sha1 = require('sha1');
var currency$1 = require('currency.js');
var util = require('util');
var openpgp = require('openpgp');
var fs = require('fs');
require('path');
var merge = require('@graphql-tools/merge');
var graphqlScalars = require('graphql-scalars');
var graphql = require('graphql');
var language = require('graphql/language');
var apolloServer = require('apollo-server');
var AWS = require('aws-sdk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var log__default = /*#__PURE__*/_interopDefaultLegacy(log$2);
var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);
var sha1__default = /*#__PURE__*/_interopDefaultLegacy(sha1);
var currency__default = /*#__PURE__*/_interopDefaultLegacy(currency$1);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var AWS__default = /*#__PURE__*/_interopDefaultLegacy(AWS);

const wrap = value => {
  if (value instanceof Mani) {
    return value
  } else {
    return new Mani(value)
  }
};

/**
 * Mani currency class. See [Currency.js](https://currency.js.org/).
 */
class Mani {
  constructor (value) {
    this.m = currency__default['default'](value, {
      symbol: 'ɱ',
      decimal: ',',
      separator: '.',
      increment: 0.05,
      errorOnInvalid: true,
      pattern: '# !',
      negativePattern: '-# !'
    });
  }

  get value () {
    return this.m.value
  }

  get intValue () {
    return this.m.intValue
  }

  add (value) {
    return new Mani(this.m.add(wrap(value).m))
  }

  subtract (value) {
    return new Mani(this.m.subtract(wrap(value).m))
  }

  multiply (value) {
    return new Mani(this.m.multiply(value))
  }

  divide (value) {
    return new Mani(this.m.divide(value))
  }

  distribute (value) {
    return new Mani(this.m.distribute(value))
  }

  positive () {
    return this.m.value > 0
  }

  negative () {
    return this.m.value < 0
  }

  format () {
    return this.m.format()
  }

  equals (value) {
    return this.intValue === wrap(value).intValue
  }

  clone () {
    return new Mani(this.value)
  }

  toString () {
    return this.m.format()
  }
}

const mani = value => new Mani(value);

/**
 * In many ways, this is the heart of the system. Thread carefully.
 */

function pad (i) {
  return ('000000000000' + i).slice(-12)
}
function other (party) { return party === 'ledger' ? 'destination' : 'ledger' }
function entryPath (entry) { return `/${pad(entry.sequence)}/${entry.uid}` }
function path (entry) { return `/${entry.ledger}${entryPath(entry)}` }
function sortKey (entry) { return `/${entry.date.toISOString()}${entryPath(entry)}` }
function destructurePath (path) {
  const match = new RegExp('/(?<ledger>[a-z0-9]+)/(?<sequence>[0-9]+)/(?<uid>[a-z0-9]+)')
    .exec(path);
  if (!match) {
    throw new Error('invalid path')
  }
  let { ledger, sequence, uid } = match.groups;
  sequence = parseInt(sequence);
  return { ledger, sequence, uid }
}
function destructure (payload, flip = false) {
  const full = '^/(?<date>[^/]+)/from(?<from>.+)(?=/to)/to(?<to>.+)(?=/)/(?<amount>[-0-9,ɱ ]+)';
  let match = new RegExp(full).exec(payload);
  if (match) {
    let { date, from, to, amount } = match.groups;
    date = new Date(date);
    from = destructurePath(from);
    to = destructurePath(to);
    amount = new Mani(amount);
    if (flip) {
      return { date, from: to, to: from, amount: amount.multiply(-1) }
    }
    return { date, from, to, amount }
  }
  throw new Error('invalid payload')
}
function toEntry (pl, flip = false) {
  const { date, from, to, amount } = destructure(pl, flip);
  const { ledger, sequence, uid } = from;
  if (flip) {
    pl = payload({ date, from, to, amount });
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
  let payload = `/${date.toISOString()}/from${path(from)}/to${path(to)}`;
  if (amount) {
    payload = payload + `/${amount.format()}`;
  }
  return payload
}
function shadowEntry (ledger) {
  // this is the "shadow entry" that sits right before the first entry on a ledger
  return {
    ledger,
    'entry': 'shadow',
    'sequence': -1,
    'next': 'init', // there is nothing before this entry
    'balance': new Mani(0)
  }
}
function addSignature (entry, ledger, signature) {
  assert__default['default'](_.isString(signature), 'signature');
  const result = { ...entry }; // cheap clone
  if (entry.ledger === ledger) {
    result.next = sha1__default['default'](signature);
    result.signature = signature;
  }
  if (entry.destination === ledger) {
    result.counterSignature = signature;
  }
  if (entry.entry === 'pending' && isSigned(result)) {
    result.entry = '/current';
  }
  return result
}
function toDb (entry) {
  return _.mapValues(entry, (value) => {
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
  if (_.isArray(entry)) {
    return _.map(entry, fromDb)
  }
  return _.mapValues(entry, (value, key) => {
    if (key === 'date') {
      return new Date(value)
    }
    if ((key === 'amount' || key === 'balance' || key === 'income') && _.isString(value)) {
      return new Mani(value)
    }
    if (key === 'demurrage' && _.isString(value)) {
      return new Mani(value)
    }
    return value
  })
}
function isSigned (entry) {
  if (_.isString(entry.signature) && entry.ledger === 'system') return true // system entries don't require counterSignatures!
  if (!_.isString(entry.signature) || !_.isString(entry.counterSignature)) {
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

const tools = { pad, other, shadowEntry, addSignature, toDb, fromDb, isSigned, next, payload, destructure, destructurePath, challenge, toEntry, sortKey, flip };

const methods = ['get', 'put', 'query', 'update'];

function table (db, TableName, options = {}) {
  const t = _.reduce(methods, (table, method) => {
    table[method] = async (param) => {
      const arg = {
        TableName,
        ...param,
        ...options
      };
      // console.log(`Executing ${method} on ${TableName} with ${JSON.stringify(param, null, 2)}`)
      return db[method](arg)
    };
    return table
  }, {});
  async function getItem (Key, errorMsg) {
    const result = await t.get({ Key });
    if (errorMsg && !result.Item) {
      throw errorMsg
    }
    return tools.fromDb(result.Item)
  }
  async function queryItems (query) {
    const items = (await t.query(query)).Items;
    return tools.fromDb(items)
  }
  return {
    getItem,
    queryItems,
    async putItem (input) {
      const Item = tools.toDb(input);
      return t.put({ Item })
    },
    attributes (attributes) {
      return table(db, TableName, { AttributesToGet: attributes, ...options })
    },
    transaction () {
      const TransactItems = [];
      return {
        getItem,
        putItem (input) {
          TransactItems.push({
            Put: {
              TableName,
              Item: tools.toDb(input),
              ...options
            } });
        },
        updateItem (Key, args) {
          TransactItems.push({
            Update: {
              TableName,
              Key,
              ...tools.toDb(args)
            }
          });
        },
        deleteItem (Key, args) {
          TransactItems.push({
            Delete: {
              TableName,
              Key,
              ...tools.toDb(args)
            }
          });
        },
        attributes () {}, // we ignore this as we don't expect transactional gets
        items () {
          return TransactItems
        },
        async execute () {
          const result = await db.transactWrite({ TransactItems });
          if (result.err) {
            log__default['default'].error(JSON.stringify(result.err, null, 2));
            throw result.err
          }
          return TransactItems.length
        }
      }
    }
  }
}

/**
 * Strictly dynamodb related system calls. Look in src/core/system.js for heavy lifting.
 */
// TODO: DEPRECATED
const PARAMS_KEY = { ledger: 'system', entry: 'parameters' };
const PK_KEY = { ledger: 'system', entry: 'pk' };

const system = function (table) {
  return {
    async parameters (required = false) {
      const errorMsg = required ? 'Missing system parameters' : undefined;
      return table.getItem(PARAMS_KEY, errorMsg)
    },
    async keys (required = false) {
      const errorMsg = required ? 'Missing system keys' : undefined;
      return table.getItem(PK_KEY, errorMsg)
    },
    async saveParameters (parameters) {
      return table.putItem({
        ...PARAMS_KEY,
        ...parameters
      })
    },
    async register (registration) {
      await table.putItem({
        ...registration,
        entry: 'pk'
      });
      return registration.ledger
    },
    // return a "transactional version" of system
    transactional (transaction = table.transaction()) {
      return {
        ...system(transaction),
        transaction,
        async execute () { return transaction.execute() }
      }
    }
  }
};

function bugfix () {
// Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
// and https://github.com/facebook/jest/issues/9983
  const textEncoding = require('text-encoding-utf-8');
  global.TextEncoder = textEncoding.TextEncoder;
  global.TextDecoder = textEncoding.TextDecoder;
}

const unpack = async (key) => {
  const { err, keys: [parsedkey] } = await openpgp.key.readArmored(key);
  if (err) {
    throw err[0]
  }
  return parsedkey
};
// reliably sort an objects keys and merge everything into one String
const sortedObjectString = (obj) => {
  return Object.keys(obj).sort().reduce((arr, key) => { arr.push(`${key}:${obj[key]}`); return arr }, []).join('|')
};

const Signer = (key, pk) => {
  const signer = {
    sign: async (input) => {
      bugfix();
      assert__default['default'](!___default['default'].isEmpty(input), 'Missing input');
      const text = typeof input === 'string' ? input : sortedObjectString(input);
      pk = pk === undefined ? await unpack(key) : pk; // lazy loaded
      const { signature: detachedSignature } = await openpgp.sign({
        message: openpgp.cleartext.fromText(text),
        privateKeys: [pk],
        detached: true
      });
      return detachedSignature
    },
    signature: async (input) => { // TODO: @deprecated
      const s = await signer.sign(input);
      const hash = sha1__default['default'](s);
      return {
        signature: s,
        hash
      }
    }
  };
  return signer
};

/**
 * Simplified, asynchronous signature verification that throws Errors when things don't line up. To use:
 *
 * `const fingerprint = await Verifier(key).verify(text, signature)`
 * The Verifier can be reused.
 *
 * @param {string} key - An armored OpenPGP (public) key
 */
const Verifier = (key, pk) => {
  let fingerprint;
  return {
    /**
     * @param {string|object} text - The text or object that was signed
     * @param {string} signature - The armored and detached OpenPGP signature
     * @returns true is the signature matches
     * @throws An error if the input (key or signature) is not in a valid format or if the signature doesn't match.
     */
    verify: async (input, signature) => {
      bugfix();
      const text = typeof input === 'string' ? input : sortedObjectString(input);
      pk = pk === undefined ? await unpack(key) : pk;
      const { signatures } = await openpgp.verify({
        message: openpgp.cleartext.fromText(text),
        signature: await openpgp.signature.readArmored(signature),
        publicKeys: [pk]
      });
      if (signatures[0].valid) {
        return true
      } else {
        throw new Error('The proof signature didn\'t match either this key or the challenge.')
      }
    },
    fingerprint: async () => {
      if (!fingerprint) {
        pk = pk === undefined ? await unpack(key) : pk;
        fingerprint = await pk.getFingerprint();
      }
      return fingerprint
    }
  }
};

const KeyWrapper = (key, pk) => {
  return {
    publicKey: Verifier(key.publicKeyArmored, pk),
    publicKeyArmored: key.publicKeyArmored,
    privateKey: Signer(key.privateKeyArmored, pk),
    privateKeyArmored: key.privateKeyArmored
    // write: async (file) => fs.writeFile(file, JSON.stringify(key))
  }
};

const KeyGenerator = (userId = {}) => {
  bugfix();
  return {
    generate: async () => {
      const key = await openpgp.generateKey({
        userIds: [userId],
        rsaBits: 4096
      });
      return KeyWrapper(key, key.key)
    }
  }
};

const log = util__default['default'].debuglog('ManiCore'); // activate by adding NODE_DEBUG=ManiCore to environment

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
  log('Getting sources');
  return mapValuesAsync(input, async (ledger, role, input) => {
    const current = await table.getItem({ ledger, entry: '/current' });
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
    log(`Getting current on ${role} ${ledger}`);
    return table.getItem({ ledger, entry: '/current' }, `No current entry on ledger ${ledger}`)
  })
}

/**
 * Get 'next' target (pending) entries.
 * There should be no pending items in the DB.
 * Used for: system init, create new ledger challenge, create transaction challenge and basic income
 */
async function getNextTargets (table, { sources }) {
  const date = new Date(Date.now());
  return mapValuesAsync(sources, async (source, role, sources) => {
    if (source.ledger !== 'system') { // the system ledger never has pending items
      const pending = await table.getItem({ ledger: source.ledger, entry: 'pending' });
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
  ledger.amount = amount;
  ledger.balance = ledger.balance.add(amount);
  ledger.challenge = payload({ date: ledger.date, from: ledger, to: destination, amount });
  if (ledger.ledger !== 'system' && ledger.balance.value < 0) throw new Error(`Amount not available on ${ledger.ledger}`)
  const complement = amount.multiply(-1);
  destination.amount = complement;
  destination.balance = destination.balance.add(complement);
  destination.challenge = payload({ date: ledger.date, from: destination, to: ledger, amount: complement });
  if (destination.ledger !== 'system' && destination.balance.value < 0) throw new Error(`Amount ${complement.format()} not available on ${destination.ledger}`)
  return { ledger, destination }
}
/**
 * Add Demmurage and Income.
 */
function addDI ({ targets: { ledger, destination } }, { demurrage, income }) {
  ledger.demurrage = ledger.balance.multiply(demurrage / 100);
  ledger.income = income;
  ledger.amount = ledger.income.subtract(ledger.demurrage);
  ledger.balance = ledger.balance.subtract(ledger.demurrage).add(ledger.income);
  ledger.challenge = payload({ date: ledger.date, from: ledger, to: destination, amount: ledger.amount });
  destination.demurrage = ledger.demurrage.multiply(-1);
  destination.income = ledger.income.multiply(-1);
  destination.amount = destination.income.subtract(destination.demurrage);
  destination.balance = destination.balance.subtract(destination.demurrage).add(destination.income);
  destination.challenge = payload({ date: ledger.date, from: destination, to: ledger, amount: destination.amount });
  return { ledger, destination }
}
/**
 * Construct targets from payloads, double-check if matches with source.
 * Used in: create new ledger, sign transaction (initial)
 */
function getPayloadTargets ({ payloads, sources }) {
  return _.mapValues(payloads, (payload, role, payloads) => {
    const { date, from: { ledger, sequence, uid }, to: { ledger: destination }, challenge, amount } = payload;
    const { sequence: sourceSequence, next, balance } = sources[role];
    assert__default['default'](sequence === (sourceSequence + 1), 'Matching sequence');
    assert__default['default'](uid === next, 'Matching next uid');
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
    const { date, from: { ledger, sequence, uid }, to: { ledger: destination }, amount } = payload;
    if (ledger === 'system') {
      const matching = await table.getItem({ ledger, entry: `/${date.toISOString()}/${sequence}/${uid}` }); // already made permanent
      if (matching) return matching
      const current = await table.getItem({ ledger, entry: '/current' });
      if (current) {
        assert__default['default'](date.getTime() === current.date.getTime(), 'Matching dates');
        assert__default['default'](amount.equals(current.amount), 'Matching amounts');
        return current
      }
      throw new Error(`Matching system entry not found`)
    } else {
      const pending = await table.getItem({ ledger, entry: 'pending' }, `No pending entry found on ledger ${ledger}`);
      assert__default['default'](date.getTime() === pending.date.getTime(), 'Matching date');
      assert__default['default'](destination === pending.destination, 'Matching destination');
      assert__default['default'](sequence === pending.sequence, 'Matching sequence');
      assert__default['default'](uid === pending.uid, 'Matching uid');
      assert__default['default'](amount.equals(pending.amount), 'matching amount');
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
      const current = await table.getItem({ ledger: target.ledger, entry: '/current' }, `No current entry found on ledger ${target.ledger}`);
      assert__default['default'](target.uid === current.next, 'Sequential uid');
      assert__default['default'](target.sequence === current.sequence + 1, 'Sequence');
      return current
    }
    // Note we don't reconstruct sources for system entries as they are necessarily already made permanent
  })
}

function addSignature$1 ({ ledger, destination }, { signature, counterSignature }) {
  ledger.signature = signature;
  ledger.next = sha1__default['default'](signature);
  destination.counterSignature = counterSignature;
  return { ledger, destination }
}

async function addSystemSignatures (table, { sources, targets }, keys) {
  // autosigning system side
  // happens during system init, UBI and creation of new ledger
  log(`Autosigning system`);
  assert__default['default'](targets.destination.ledger === 'system' && targets.ledger.destination === 'system', 'System destination');
  if (!keys) {
    keys = KeyWrapper(await table.getItem({ ledger: 'system', entry: 'pk' }, 'System keys not found'));
  }
  // log(JSON.stringify(targets, null, 2))
  targets.destination.signature = await keys.privateKey.sign(targets.destination.challenge);
  const next = sha1__default['default'](targets.destination.signature);
  targets.destination.next = next;
  if (targets.ledger.ledger === 'system') {
    // system init
    assert__default['default'](targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init');
    const signature = targets.destination.signature;
    targets.ledger.signature = signature;
    targets.ledger.counterSignature = signature;
    targets.ledger.next = next;
    targets.destination.counterSignature = signature;
  } else {
    targets.ledger.counterSignature = await keys.privateKey.sign(targets.ledger.challenge);
  }
  return targets
}
/**
 * Add signatures, autosigning system entries.
 * This automatically saves entries.
 */
async function addSignatures (table, { targets }, { ledger, signature, counterSignature, publicKeyArmored }) {
  if (ledger) {
    assert__default['default'](ledger === targets.ledger.ledger, 'Target ledger');
    if (!publicKeyArmored) {
      ({ publicKeyArmored } = await table.getItem({ ledger, entry: 'pk' }));
      if (!publicKeyArmored) throw new Error(`Unkown ledger ${ledger}`)
    }
    const verifier = Verifier(publicKeyArmored);
    await verifier.verify(targets.ledger.challenge, signature); // throws error if wrong
    await verifier.verify(targets.destination.challenge, counterSignature); // throws error if wrong
    targets = addSignature$1(targets, { signature, counterSignature });
  }
  return targets
}
/**
 * Transition entries, adding/updating/deleting DB entries where necessarywhere necessary
 */
function transition (table, { source, target }) {
  if (target.entry === 'pending' && isSigned(target)) {
    target.entry = '/current';
    table.putItem(target);
    if (target.ledger !== 'system') {
      table.deleteItem({ ledger: target.ledger, entry: 'pending' });
    }
    if (source && source.entry === '/current') {
      // bump to a permanent state
      source.entry = sortKey(source);
      table.putItem(source);
    }
  } else {
    // no state transition, we just save the target
    table.putItem(target);
  }
}
/**
 * Save the targets, transitioning entry states where relevant.
 */
function saveResults (table, { sources, targets }) {
  if (sources.ledger.ledger !== 'system') { // only happens during system init
    transition(table, { source: sources.ledger, target: targets.ledger });
  } else {
    assert__default['default'](targets.destination.challenge === targets.ledger.challenge, 'Oroborous system init');
  }
  transition(table, { source: sources.destination, target: targets.destination });
}

// const log = require('util').debuglog('Transactions')
/**
 * This is the way.
 */
const StateMachine = (table) => {
  const context = {};
  return {
    getPayloads (payload) {
      context.payloads = getPayloads(payload);
      return Sourcing(context)
    },
    async getSources (ledgers) {
      return Sourcing(context).getSources(ledgers)
    }
  }
  function Sourcing (context) {
    return {
      async getSources (ledgers) {
        context.sources = await getSources(table, ledgers);
        return Targets(context)
      },
      async getPayloadSources () {
        context.sources = await getPayloadSources(table, context);
        return Targets(context)
      },
      async continuePending () {
        context.targets = await getPendingTargets(table, context);
        context.sources = await getPendingSources(table, context);
        // log(JSON.stringify(context, null, 2))
        return Continue(context)
      }
    }
  }
  async function Targets (context) {
    if (context.payloads) {
      return {
        continuePayload () {
          context.targets = getPayloadTargets(context);
          return Continue(context)
        }
      }
    } else {
      context.targets = await getNextTargets(table, context);
      return {
        addAmount (amount) {
          context.targets = addAmount(context, amount);
          return Continue(context)
        },
        addDI (DI) {
          context.targets = addDI(context, DI);
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
        context.targets = await addSystemSignatures(table, context, keys);
        return Continue(context)
      },
      async addSignatures (signatures) {
        context.targets = await addSignatures(table, context, signatures);
        return Continue(context)
      },
      async save () {
        saveResults(table, context);
      }
    }
  }
};

const log$1 = require('util').debuglog('Transactions');

/**
 * Transactions are the way a user sees the ledger.
 */
const TransactionsDynamo = (table, ledger, verification) => {
  assert__default['default'](_.isObject(verification), 'Verification');
  // to reduce the size of the results, we limit the attributes requested (omitting the signatures)
  const short = table.attributes(['ledger', 'destination', 'amount', 'balance', 'date', 'payload', 'next', 'sequence', 'uid', 'income', 'demurrage', 'challenge']);
  return {
    table, // we allow access to the underlying table
    async current () {
      return short.getItem({ ledger, entry: '/current' })
    },
    async currentFull () {
      return table.getItem({ ledger, entry: '/current' })
    },
    async pending () {
      return table.getItem({ ledger, entry: 'pending' })
    },
    async recent () {
      return table.queryItems({
        KeyConditionExpression: 'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledger': ledger,
          ':slash': '/'
        }
      })
    },
    async challenge (destination, amount) {
      return StateMachine(table)
        .getSources({ ledger, destination })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async create (proof) {
      const existing = await table.getItem({ ledger, entry: 'pending' });
      if (existing && existing.challenge === proof.payload) {
        console.log(`Transaction ${proof.payload} was already created`);
        return existing.next // idempotency
      }
      let next;
      const transaction = table.transaction();
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .getPayloadSources()
        .then(t => t.continuePayload())
        .then(t => t.addSignatures({ ledger, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next;
          return t
        })
        .then(t => t.save());
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      await transaction.execute();
      return next
    },
    async confirm (proof) {
      // proof contains signature, counterSignature, payload
      const existing = await table.getItem({ ledger, entry: '/current' });
      if (existing && existing.challenge === proof.payload) {
        console.log(`Transaction ${proof.payload} was already confirmed`);
        return existing.next // idempotency
      }
      let next;
      const transaction = table.transaction();
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .continuePending()
        .then(t => t.addSignatures({ ledger, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next;
          return t
        })
        .then(t => t.save());
      await transaction.execute();
      log$1(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`);
      return next
    },
    async cancel (challenge) {
      const pending = await table.getItem({ ledger, entry: 'pending' });
      if (pending && pending.challenge === challenge) {
        if (pending.destination === 'system') throw new Error('System transactions cannot be cancelled.')
        const destination = await table.getItem({ ledger: pending.destination, entry: 'pending' });
        if (!destination) throw new Error('No matching transaction found on destination ledger, please contact system administrators.')
        const transaction = table.transaction();
        transaction.deleteItem({ ledger, entry: 'pending' });
        transaction.deleteItem({ ledger: pending.destination, entry: 'pending' });
        await transaction.execute();
        return 'Pending transaction successfully cancelled.'
      } else {
        return 'No matching pending transaction found, it may have already been cancelled or confirmed.'
      }
    },
    // deprecated
    async saveEntry (entry) {
      assert__default['default'](entry.ledger === ledger, 'Matching ledger');
      await verification.verifyEntry(entry);
      return table.putItem(entry)
    },
    // deprecated
    async saveTwin (twin) {
      assert__default['default'](twin.ledger.ledger === ledger, 'Matching source ledger');
      assert__default['default'](twin.destination.ledger === ledger, 'Matching destination ledger');
      const transaction = table.transaction();
      twin.forEach((entry) => {
        verification.verifyEntry(entry);
        transaction.putItem(entry);
      });
      return transaction.execute()
    },
    // deprecated
    // return a "transactional version" of transactions
    transactional (transaction = table.transaction()) {
      return {
        ...TransactionsDynamo(transaction, ledger, verification),
        transaction,
        async execute () { return transaction.execute() }
      }
    }
  }
};

const verification = (table) => {
  const verification = {
    async getVerifier (ledger) {
      const result = await table.attributes(['publicKeyArmored']).getItem({ ledger, entry: 'pk' });
      if (!result || !result.publicKeyArmored) {
        throw new Error(`No public key found for ${ledger}`)
      }
      const ver = Verifier(result.publicKeyArmored);
      if (ledger !== 'system') {
        // check fingerprint
        const fingerprint = await ver.fingerprint();
        if (fingerprint !== ledger) {
          throw new Error(`Mismatch between ledger ${ledger} and its public key`)
        }
      }
      return ver
    },
    async verifyEntry (entry) {
      // note that this simply throws errors if anything is amis
      const payload = entry.payload;
      if (entry.signature) {
        await (await verification.getVerifier(entry.ledger)).verify(payload, entry.signature);
      }
      if (entry.counterSignature) {
        await (await verification.getVerifier(entry.destination)).verify(payload, entry.counterSignature);
      }
    }
  };
  return verification
};

const IndexDynamo = (db, tableName) => {
  const T = table(db, tableName);
  const verify = verification(T);
  return {
    table: T,
    system: system(T),
    transactions: (ledger) => TransactionsDynamo(T, ledger, verify),
    findkey: async (ledger) => {
      return T.attributes(['ledger', 'publicKeyArmored', 'alias']).getItem({ ledger, entry: 'pk' })
    }
  }
};

const SystemSchema = apolloServerLambda.gql`
  type SystemParameters {
    "The (monthly) (basic) income"
    income: Currency!
    "(monthly) demurrage in percentage (so 5.0 would be a 5% demurrage)"
    demurrage: NonNegativeFloat!
  }
  
  type Ledger {
    "The unique id of the ledger, the fingerprint of its public key."
    ledger: String!
    "The (armored) public key of this ledger"
    publicKeyArmored: String
    "A user readable alias for this ledger."
    alias: String
  }

  input LedgerRegistration {
    "The public key used to create the ledger."
    publicKeyArmored: String!
    "Payload that was signed as a challenge"
    payload: String!
    "Signature of the payload by the private key corresponding to this public key"
    signature: String!
    "Signature of the 'flipped' payload (the transaction opposite to the payload)"
    counterSignature: String! 
    "A publically available alias of this ledger."
    alias: String
  }

  type Jubilee {
    ledgers: Int
    demurrage: Currency!
    income: Currency!
  }
  
  type System {
    "The current income and demurrage settings, returns nothing when system hasn't been initialized yet"
    parameters: SystemParameters
    "Text to be signed by client to verify key ownership"
    challenge: String!
    "Find the public key corresponding to this (fingerprint) id"
    findkey(id: String!): Ledger
    "Register a new ledger, returns the id (fingerprint)"
    register(registration: LedgerRegistration!): String
  }

  type Admin {
    # apply demurrage and (basic) income to all accounts
    jubilee(ledger: String): Jubilee!
    # initialize the system
    init: String
  }

  type Query {
    # access to system internals
    system: System!
  }

  type Mutation {
    admin: Admin
  }
`;

var transactions = apolloServerLambda.gql`
  type Transaction {
    "ID of the origin ledger (should be user account)"
    ledger: String!
    "ID of destination ledger"
    destination: String
    "The amount to transfer. Note that a negative amount means it will be decrease the balance on this ledger ('outgoing'), a positive amount is 'incoming'"
    amount: Currency!
    "The ledger balance after the transfer"
    balance: Currency!
    "The date when this transfer was initiated"
    date: DateTime!
    "If the transaction was based on a jubilee, this show the proportion due to income."
    income: Currency
    "If the transaction was based on a jubilee, this show the proportion due to demurrage."
    demurrage: Currency
    "A unique representation of transaction used to create signatures"
    challenge: String
    "An (optional) message that was added to the transaction"
    message: String
    "Set to true if the ledger still needs to sign. (The destination may or may not have already provided a counter-signature.)"
    toSign: Boolean
  }
  
  type LedgerQuery {
    transactions: TransactionQuery
    # to add: notifications, issuedBuffers, standingOrders, contacts, demurageHistory
  }
  
  input Proof {
    payload: String!
    "Signature of the payload by the private key corresponding to this public key"
    signature: String!
    "Signature of the 'flipped' payload (the transaction opposite to the payload)"
    counterSignature: String! 
  }

  type TransactionQuery {
    "Current transaction aka the current balance of the ledger"
    current: Transaction
    "Pending transaction (note: use the signing interface to sign, not this informative entry)"
    pending: Transaction
    "Most recent transactions"
    recent: [Transaction]
    "Provide transaction challenge with supplied destination and amount"
    challenge(destination: String, amount: Currency): String
    "Create (pending) transaction"
    create(proof: Proof!): String
    "Confirm pending transaction"
    confirm(proof: Proof!): String
    "Cancel the currently pending transaction, matching this challenge."
    cancel(challenge: String!): String!
  }

  type Query {
    "All ledger related queries"
    ledger(id: String!): LedgerQuery
  }
`;

const schema = apolloServerLambda.gql`
  scalar DateTime
  scalar NonNegativeFloat
  scalar Currency
  
  type Query {
    time: DateTime!
  }
`;

var typeDefs = merge.mergeTypeDefs([schema, SystemSchema, transactions]);

const currency = new graphql.GraphQLScalarType({
  name: 'Currency',
  description: 'Custom scalar type for working consistently with currency-style fractions',
  // value sent to the client
  serialize (value) {
    if (value instanceof Mani) {
      return value.format()
    } else {
      // note that this is quite permissive and will even allow something like "MANI 10 00,5" as input
      return mani(value).format()
    }
  },
  // value from the client
  parseValue (value) {
    return mani(value)
  },
  // value from client in AST representation
  parseLiteral (ast) {
    if (ast.kind !== language.Kind.STRING || ast.kind !== language.Kind.INT || ast.kind !== language.Kind.FLOAT) {
      throw new TypeError(
        `Unknown representation of currency ${'value' in ast && ast.value}`
      )
    }
    return mani(ast.value)
  }
});

/**
 * Since Apollo Server has its own ideas about error logging, we intercept them early.
 * This function wraps an asynchronous function that might throw an error.
 */
const wrap$1 = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      log__default['default'].error('Error while executing async fn');
      log__default['default'].error(err);
      log__default['default'].error(JSON.stringify(err, null, 2));
      throw new apolloServer.ApolloError(err)
    }
  }
};

const PARAMS_KEY$1 = { ledger: 'system', entry: 'parameters' };
const PK_KEY$1 = { ledger: 'system', entry: 'pk' };
const logutil = util__default['default'].debuglog('SystemCore'); // activate by adding NODE_DEBUG=SystemCore to environment

const SystemCore = (table, userpool) => {
  const log = (msg) => {
    logutil(msg);
  };
  return {
    async parameters () {
      return table.getItem(PARAMS_KEY$1)
    },
    async init () {
      log('System init');
      let keys = await table.getItem(PK_KEY$1);
      if (keys) {
        log('System already initialized');
        return // idempotency
      }
      const trans = table.transaction();
      keys = await KeyGenerator().generate();
      log('Keys generated');
      const { publicKeyArmored, privateKeyArmored } = keys;
      trans.putItem({ ...PK_KEY$1, publicKeyArmored, privateKeyArmored });
      trans.putItem({ ...PARAMS_KEY$1, income: mani(100), demurrage: 5.0 });
      log('Keys and parameters stored');
      await StateMachine(trans)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save()).catch(err => log(err, err.stack));
      log(`Database update:\n${JSON.stringify(trans.items(), null, 2)}`);
      await trans.execute();
      return `SuMsy initialized with ${mani(100).format()} income and 5% demurrage.`
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      return StateMachine(table)
        .getSources({ ledger: '<fingerprint>', destination: 'system' })
        .then(t => t.addAmount(mani(0)))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async register (registration) {
      const { publicKeyArmored, payload, alias } = registration;
      const ledger = await Verifier(publicKeyArmored).fingerprint();
      const existing = await table.getItem({ ledger, entry: '/current' });
      if (existing) return ledger
      const transaction = table.transaction();
      // TODO: assert amount = 0
      await StateMachine(transaction)
        .getPayloads(payload)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.continuePayload())
        .then(t => t.addSystemSignatures())
        .then(t => t.addSignatures({ ledger, ...registration }))
        .then(t => t.save());
      // log('Registration context:\n' + JSON.stringify(context, null, 2))
      transaction.putItem({ ledger, entry: 'pk', publicKeyArmored, alias, challenge: payload });
      await transaction.execute();
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return ledger
    },
    async jubilee (ledger) {
      const results = {
        ledgers: 0,
        demurrage: mani(0),
        income: mani(0)
      };
      const parameters = await table.getItem(PARAMS_KEY$1, 'Missing system parameters');
      async function applyJubilee (ledger) {
        const transaction = table.transaction();
        log(`Applying DI to ${ledger}`);
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addDI(parameters))
          .then(t => {
            const entry = t.getPrimaryEntry();
            results.income = results.income.add(entry.income);
            results.demurrage = results.demurrage.add(entry.demurrage);
            results.ledgers++;
            return t
          })
          .then(t => t.addSystemSignatures())
          .then(t => t.save());
        await transaction.execute();
      }
      if (ledger) {
        await applyJubilee(ledger);
      } else {
        const users = await userpool.listJubileeUsers();
        for (let { ledger } of users) { // these for loops allow await!
          await applyJubilee(ledger);
        }
      }
      // log(`Database update:\n${JSON.stringify(transaction.items(), null, 2)}`)
      return results
    }
  }
};

const SystemResolvers = {
  Query: {
    'system': wrap$1((_, args, { indexDynamo, userpool }) => {
      return SystemCore(indexDynamo.table, userpool)
    })
  },
  'Mutation': {
    'admin': wrap$1((_, args, { indexDynamo, admin, userpool, ledger }) => {
      if (!admin) {
        log__default['default'].error(`Illegal system access attempt by ${ledger}`);
        throw new apolloServer.ForbiddenError('Access denied')
      }
      return SystemCore(indexDynamo.table, userpool)
    })
  },
  'System': {
    'register': wrap$1(async (SystemCore, { registration }, { indexDynamo }) => {
      return SystemCore.register(registration)
    }),
    'parameters': wrap$1(async (SystemCore, args, { indexDynamo }) => {
      return SystemCore.parameters()
    }),
    'challenge': wrap$1(async (SystemCore) => {
      return SystemCore.challenge()
    }),
    'findkey': wrap$1(async (SystemCore, { id }, { indexDynamo }) => {
      return indexDynamo.findkey(id)
    })
  },
  'Admin': {
    'init': wrap$1(async (SystemCore, noargs, { admin }) => {
      return SystemCore.init()
    }),
    'jubilee': wrap$1(async (SystemCore, { ledger }, { userpool, admin }) => {
      return SystemCore.jubilee(ledger)
    })
  }
};

const TransactionResolvers = {
  Query: {
    ledger: (_, { id }) => {
      return id // optional: check if this even exists?
    }
  },
  'LedgerQuery': {
    'transactions': (id, arg, { indexDynamo, ledger, verified }) => {
      if (id !== ledger) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`;
        log__default['default'].error(err);
        throw new apolloServer.ForbiddenError(err)
      }
      return indexDynamo.transactions(id)
    }
  },
  'TransactionQuery': {
    'current': async (transactions, arg) => {
      return transactions.current()
    },
    'pending': async (transactions, arg) => {
      const pending = await transactions.pending();
      if (pending) {
        return {
          ...pending,
          message: 'Pending',
          toSign: _.isEmpty(pending.signature)
        }
      }
    },
    'recent': wrap$1(async (transactions, arg) => {
      return transactions.recent()
    }),
    'challenge': wrap$1(async (transactions, { destination, amount }) => {
      return transactions.challenge(destination, amount)
    }),
    'create': wrap$1(async (transactions, { proof }) => {
      return transactions.create(proof)
    }),
    'confirm': wrap$1(async (transactions, { proof }) => {
      return transactions.confirm(proof)
    }),
    'cancel': wrap$1(async (transactions, { challenge }) => {
      return transactions.cancel(challenge)
    })
  }
};

const IndexResolvers = _.merge(
  {
    DateTime: graphqlScalars.DateTimeResolver,
    NonNegativeFloat: graphqlScalars.NonNegativeFloatResolver
  },
  { Currency: currency },
  {
    Query: {
      time: () => new Date(Date.now())
    }
  },
  SystemResolvers,
  TransactionResolvers
);

// TODO: continue the pagination token
const CognitoUserPool = (UserPoolId) => {
  return {
    listJubileeUsers: async (PaginationToken) => {
      const provider = new AWS__default['default'].CognitoIdentityServiceProvider();
      provider.listUsersPromise = util.promisify(provider.listUsers);
      const params = {
        UserPoolId,
        PaginationToken,
        AttributesToGet: [ 'sub', 'username', 'cognito:user_status', 'status', 'ledger' ] // TODO: add extra verification/filters?
      };
      const cognitoUsers = await provider.listUsersPromise(params);
      if (cognitoUsers.err) {
        throw cognitoUsers.err
      }
      return cognitoUsers.data.Users.map(({ Username, Attributes }) => {
        return {
          username: Username,
          ..._.reduce(Attributes, (acc, att) => {
            acc[att.Name] = att.Value;
            return acc
          }, {})
        }
      })
    }
  }
};

/**
 * For offline development only!
 *
 * Expected format of user records:
 *
 * { ledger: '<fingerprint>'}
 */
const OfflineUserPool = (path = '.jubilee.users.json') => {
  const contents = fs__default['default'].readFileSync(path, { encoding: 'utf-8' });
  if (!contents) console.log(`Please make sure ${path} is present`);
  const jubilee = JSON.parse(contents);
  log__default['default'].info(`Loaded jubilee users from ${path}`);
  return {
    // Users that have been added to the "jubilee" group
    async listJubileeUsers () {
      return jubilee
    }
  }
};

log__default['default'].setLevel('info');

function contextProcessor (event) {
  const { headers } = event;
  // fake the cognito interface if offline
  let claims = process.env.IS_OFFLINE ? JSON.parse(headers['x-claims']) : event.requestContext.authorizer.claims;
  console.log(`User claims ${JSON.stringify(claims)}`);
  let userpool = process.env.IS_OFFLINE ? OfflineUserPool() : CognitoUserPool(process.env.USER_POOL);
  return {
    userpool,
    ledger: claims.sub,
    verified: claims.verified,
    admin: claims.admin
  }
}

const server = new apolloServerLambda.ApolloServer({
  debug: process.env.DEBUG === 'true',
  typeDefs,
  resolvers: IndexResolvers,
  formatError: err => {
    console.error(err, err.stack);
    return err
  },
  context: async ({ event, context }) => {
    return {
      indexDynamo: IndexDynamo(
        dynamoPlus.DynamoPlus({
          region: process.env.DYN_REGION,
          endpoint: process.env.DYN_ENDPOINT
        }),
        process.env.DYN_TABLE
      ),
      ...contextProcessor(event)
    }
  }
});

function graphqlHandler (event, context, callback) {
  server.createHandler({
    cors: {
      origin: '*',
      credentials: true
    }
  })(event, context, callback);
}

exports.graphqlHandler = graphqlHandler;
