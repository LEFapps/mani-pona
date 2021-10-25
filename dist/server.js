'use strict';

var apolloServerLambda = require('apollo-server-lambda');
var apolloServerCore = require('apollo-server-core');
var dynamoPlus = require('dynamo-plus');
var http = require('http');
var assert = require('assert');
var sha1 = require('sha1');
var _ = require('lodash');
var openpgp = require('openpgp');
require('lodash/random');
var currency$1 = require('currency.js');
var serverLog = require('server-log');
var merge = require('@graphql-tools/merge');
var graphqlScalars = require('graphql-scalars');
var graphql = require('graphql');
var language = require('graphql/language');
var apolloServer = require('apollo-server');
var AWS = require('aws-sdk');
var util = require('util');
var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);
var sha1__default = /*#__PURE__*/_interopDefaultLegacy(sha1);
var currency__default = /*#__PURE__*/_interopDefaultLegacy(currency$1);
var AWS__default = /*#__PURE__*/_interopDefaultLegacy(AWS);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

// reliably sort an objects keys and merge everything into one String
const sortedObjectString = obj => {
  return Object.keys(obj)
    .sort()
    .reduce((arr, key) => {
      arr.push(`${key}:${obj[key]}`);
      return arr
    }, [])
    .join('|')
};
/**
 * Sign with private key. You can pass the already parse privateKey if you have it, otherwise it will be lazy loaded from the armored version.
 */
const Signer = (armoredPrivateKey, privateKey) => {
  const signer = {
    sign: async input => {
      // assert(!_.isEmpty(input), 'Missing input')
      const text = typeof input === 'string' ? input : sortedObjectString(input);
      privateKey =
        privateKey === undefined
          ? await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey })
          : privateKey; // lazy loaded
      return openpgp.sign({
        message: await openpgp.createMessage({ text }),
        signingKeys: privateKey,
        detached: true
      })
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
const Verifier = (armoredPublicKey, publicKey) => {
  let fingerprint;
  return {
    /**
     * @param {string|object} text - The text or object that was signed
     * @param {string} signature - The armored and detached OpenPGP signature
     * @returns true is the signature matches
     * @throws An error if the input (key or signature) is not in a valid format or if the signature doesn't match.
     */
    verify: async (input, armoredSignature) => {
      const text = typeof input === 'string' ? input : sortedObjectString(input);
      publicKey =
        publicKey === undefined
          ? await openpgp.readKey({ armoredKey: armoredPublicKey })
          : publicKey; // lazy loaded
      await openpgp.verify({
        message: await openpgp.createMessage({ text }),
        signature: await openpgp.readSignature({ armoredSignature }),
        verificationKeys: publicKey,
        expectSigned: true, // automatically throws an error
        date: new Date(Date.now() + 1000 * 60 * 10)
      });
      return true
    },
    fingerprint: async () => {
      if (!fingerprint) {
        publicKey =
          publicKey === undefined
            ? await openpgp.readKey({ armoredKey: armoredPublicKey })
            : publicKey; // lazy loaded
        fingerprint = publicKey.getFingerprint();
      }
      return fingerprint
    }
  }
};

const KeyWrapper = key => {
  return {
    publicKey: Verifier(key.publicKeyArmored),
    publicKeyArmored: key.publicKeyArmored,
    privateKey: Signer(key.privateKeyArmored),
    privateKeyArmored: key.privateKeyArmored
  }
};

const KeyGenerator = (userId = {}, log = () => {}) => {
  return {
    generate: async () => {
      // simply add 'passphrase' as an option here to protect the key:
      log('Generating keys');
      const key = await openpgp.generateKey({
        userIDs: userId,
        //        type: 'rsa',
        // rsaBits: 4096,
        type: 'ecc',
        format: 'object'
      });
      log('Keys generated');
      return {
        publicKey: Verifier(key.publicKey.armor(), key.publicKey),
        publicKeyArmored: key.publicKey.armor(),
        privateKey: Signer(key.privateKey.armor(), key.privateKey),
        privateKeyArmored: key.privateKey.armor()
      }
    }
  }
};

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

  zero () {
    return this.m.value === 0
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

const mani$1 = value => new Mani(value);

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
  ).exec(path);
  if (!match) {
    throw new Error('invalid path')
  }
  let { ledger, sequence, uid } = match.groups;
  sequence = parseInt(sequence);
  return { ledger, sequence, uid }
}
function destructure (payload, flip = false) {
  const full =
    '^/(?<date>[^/]+)/from(?<from>.+)(?=/to)/to(?<to>.+)(?=/)/(?<amount>[-0-9,ɱ ]+)';
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
    entry: 'shadow',
    sequence: -1,
    next: 'init', // there is nothing before this entry
    balance: new Mani(0)
  }
}
function addSignature$1 (entry, ledger, signature) {
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
  return _.mapValues(entry, value => {
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
    if (
      (key === 'amount' ||
        key === 'balance' ||
        key === 'income' ||
        key === 'buffer') &&
      _.isString(value)
    ) {
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
const sortBy = (property, direction = 'ASC') => {
  return (a, b) => {
    let aa = _.get(a, property, 0);
    let bb = _.get(b, property, 0);
    if (_.isDate(aa)) aa = aa.valueOf();
    if (_.isDate(bb)) bb = bb.valueOf();
    if (direction === 'ASC') return aa - bb
    return bb - aa
  }
};

const tools = {
  pad,
  other,
  shadowEntry,
  addSignature: addSignature$1,
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
  flip
};

const log$9 = serverLog.getLogger('core:util');
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
  log$9.debug('Getting sources for %j', input);
  return mapValuesAsync(input, async (ledger, role, input) => {
    const current = await table.current(ledger);
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
      log$9.debug('Getting current on %s %s', role, ledger);
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
  const date = new Date(Date.now());
  return mapValuesAsync(sources, async (source, role, sources) => {
    if (source.ledger !== 'system') {
      // the system ledger never has pending items
      const pending = await table.pending(source.ledger);
      if (pending) { throw new Error(`Ledger ${source.ledger} already has a pending entry: ${JSON.stringify(pending)}`) }
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
  ledger.challenge = payload({
    date: ledger.date,
    from: ledger,
    to: destination,
    amount
  });
  if (ledger.ledger !== 'system' && ledger.balance.value < 0) { throw new Error(`Amount not available on ${ledger.ledger}`) }
  const complement = amount.multiply(-1);
  destination.amount = complement;
  destination.balance = destination.balance.add(complement);
  destination.challenge = payload({
    date: ledger.date,
    from: destination,
    to: ledger,
    amount: complement
  });
  if (destination.ledger !== 'system' && destination.balance.value < 0) {
    throw new Error(
      `Amount ${complement.format()} not available on ${destination.ledger}`
    )
  }
  return { ledger, destination }
}
/**
 * Add Demmurage and Income, optionally using a buffer.
 */
function addDI ({ targets: { ledger, destination } }, { demurrage, income, buffer }) {
  ledger.demurrage = ledger.balance.subtract(buffer).multiply(demurrage / 100);
  ledger.income = income;
  ledger.amount = ledger.income.subtract(ledger.demurrage);
  ledger.balance = ledger.balance.subtract(ledger.demurrage).add(ledger.income);
  ledger.challenge = payload({
    date: ledger.date,
    from: ledger,
    to: destination,
    amount: ledger.amount
  });
  destination.demurrage = ledger.demurrage.multiply(-1);
  destination.income = ledger.income.multiply(-1);
  destination.amount = destination.income.subtract(destination.demurrage);
  destination.balance = destination.balance
    .subtract(destination.demurrage)
    .add(destination.income);
  destination.challenge = payload({
    date: ledger.date,
    from: destination,
    to: ledger,
    amount: destination.amount
  });
  return { ledger, destination }
}
/**
 * Construct targets from payloads, double-check if matches with source.
 * Used in: create new ledger, sign transaction (initial)
 */
function getPayloadTargets ({ payloads, sources }) {
  return _.mapValues(payloads, (payload, role, payloads) => {
    const {
      date,
      from: { ledger, sequence, uid },
      to: { ledger: destination },
      challenge,
      amount
    } = payload;
    const { sequence: sourceSequence, next, balance } = sources[role];
    assert__default['default'](sequence === sourceSequence + 1, 'Matching sequence');
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
    const {
      date,
      from: { ledger, sequence, uid },
      to: { ledger: destination },
      amount
    } = payload;
    if (ledger === 'system') {
      const matching = await table.entry(ledger, `/${date.toISOString()}/${sequence}/${uid}`); // already made permanent
      if (matching) return matching
      const current = await table.current(ledger);
      if (current) {
        assert__default['default'](date.getTime() === current.date.getTime(), 'Matching dates');
        assert__default['default'](amount.equals(current.amount), 'Matching amounts');
        return current
      }
      throw new Error(`Matching system entry not found`)
    } else {
      const pending = await table.pending(ledger, true);
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
      const current = await table.current(target.ledger, true);
      assert__default['default'](target.uid === current.next, 'Sequential uid');
      assert__default['default'](target.sequence === current.sequence + 1, 'Sequence');
      return current
    }
    // Note we don't reconstruct sources for system entries as they are necessarily already made permanent
  })
}

function addSignature (
  { ledger, destination },
  { signature, counterSignature }
) {
  ledger.signature = signature;
  ledger.next = sha1__default['default'](signature);
  destination.counterSignature = counterSignature;
  return { ledger, destination }
}

async function addSystemSignatures (table, { sources, targets }, keys) {
  // autosigning system side
  // happens during system init, UBI and creation of new ledger
  log$9.info(`Autosigning system (only during init)`);
  assert__default['default'](
    targets.destination.ledger === 'system' &&
      targets.ledger.destination === 'system',
    'System destination'
  );
  if (!keys) {
    keys = KeyWrapper(
      await table.keys('system', true)
    );
  }
  log$9.debug('Signing targets %j', targets);
  log$9.debug('with keys %j', keys);
  // log(JSON.stringify(targets, null, 2))
  targets.destination.signature = await keys.privateKey.sign(
    targets.destination.challenge
  );
  const next = sha1__default['default'](targets.destination.signature);
  targets.destination.next = next;
  if (targets.ledger.ledger === 'system') {
    // system init
    assert__default['default'](
      targets.destination.challenge === targets.ledger.challenge,
      'Oroborous system init'
    );
    const signature = targets.destination.signature;
    targets.ledger.signature = signature;
    targets.ledger.counterSignature = signature;
    targets.ledger.next = next;
    targets.destination.counterSignature = signature;
  } else {
    targets.ledger.counterSignature = await keys.privateKey.sign(
      targets.ledger.challenge
    );
  }
  return targets
}
/**
 * Add signatures, autosigning system entries.
 * This automatically saves entries.
 */
async function addSignatures (
  table,
  { targets },
  { ledger, signature, counterSignature, publicKeyArmored }
) {
  if (ledger) {
    assert__default['default'](ledger === targets.ledger.ledger, 'Target ledger');
    if (!publicKeyArmored) {
({ publicKeyArmored } = await table.keys(ledger, true));
      if (!publicKeyArmored) throw new Error(`Missing PK:  ${ledger}`)
    }
    const verifier = Verifier(publicKeyArmored);
    await verifier.verify(targets.ledger.challenge, signature); // throws error if wrong
    await verifier.verify(targets.destination.challenge, counterSignature); // throws error if wrong
    targets = addSignature(targets, { signature, counterSignature });
  }
  return targets
}
/**
 * Transition entries, adding/updating/deleting DB entries where necessarywhere necessary
 */
function transition (table, { source, target }) {
  if (target.entry === 'pending' && isSigned(target)) {
    target.entry = '/current';
    table.putEntry(target);
    if (target.ledger !== 'system') {
      table.deletePending(target.ledger);
    }
    if (source && source.entry === '/current') {
      // bump to a permanent state
      source.entry = sortKey(source);
      table.putEntry(source);
    }
  } else {
    // no state transition, we just save the target
    table.putEntry(target);
  }
}
/**
 * Save the targets, transitioning entry states where relevant.
 */
function saveResults (table, { sources, targets }) {
  if (sources.ledger.ledger !== 'system') {
    // only happens during system init
    transition(table, { source: sources.ledger, target: targets.ledger });
  } else {
    assert__default['default'](
      targets.destination.challenge === targets.ledger.challenge,
      'Oroborous system init'
    );
  }
  transition(table, {
    source: sources.destination,
    target: targets.destination
  });
}

/**
 * This is the way.
 *
 * (table is actually a core/ledgers object)
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

const PARAMETERS = { income: mani$1(100), demurrage: 5.0 };
const log$8 = serverLog.getLogger('core:system');

function System (ledgers, userpool) {
  return {
    async parameters () {
      return PARAMETERS
    },
    async findkey (fingerprint) {
      return ledgers.publicKey(fingerprint)
    },
    async findUser (username) {
      log$8.debug('Finding user %s', username);
      return userpool.findUser(username)
    },
    getAccountTypes () {
      return userpool.getAccountTypes()
    },
    async changeAccountType (Username, type) {
      const allowedTypes = userpool.getAccountTypes().map(t => t.type);
      if (!allowedTypes.includes(type)) {
        throw new Error(
          `Unknown account type ${type}, allowed values ${allowedTypes.join(
            ','
          )}`
        )
      }
      log$8.debug('Setting account type to %s for user %s', type, Username);
      userpool.changeAttributes(Username, { 'custom:type': type });
    },
    async disableAccount (Username) {
      return userpool.disableAccount(Username)
    },
    async enableAccount (Username) {
      return userpool.enableAccount(Username)
    },
    async init () {
      log$8.info('System init requested');
      let keys = await ledgers.keys('system');
      log$8.info('Checking keys');
      if (keys) {
        log$8.info('System already initialized');
        return // idempotency
      }
      log$8.info('Generating system keys');
      // initializing fresh system:
      keys = await KeyGenerator({}, log$8.info).generate();
      log$8.info('System keys generated');
      const { publicKeyArmored, privateKeyArmored } = keys;
      const trans = ledgers.transaction();
      trans.putKey({ ledger: 'system', publicKeyArmored, privateKeyArmored });
      await StateMachine(trans)
        .getSources({ ledger: 'system', destination: 'system' })
        .then(t => t.addAmount(mani$1(0)))
        .then(t => t.addSystemSignatures(keys))
        .then(t => t.save())
        .catch(err => log$8.error('System initialization failed\n%j', err));
      log$8.debug('Database update: %j', trans.items());
      log$8.info('System keys and parameters stored');
      await trans.execute();
      return `SuMsy initialized with ${mani$1(
        100
      ).format()} income and 5% demurrage.`
    },
    async challenge () {
      // provides the payload of the first transaction on a new ledger
      // clients have to replace '<fingerprint>'
      return StateMachine(ledgers)
        .getSources({ ledger: '<fingerprint>', destination: 'system' })
        .then(t => t.addAmount(mani$1(0)))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async register (registration, username) {
      log$8.debug('REGISTERING %s', username);
      const { publicKeyArmored, payload, alias } = registration;
      const ledger = await Verifier(publicKeyArmored).fingerprint();
      const existing = await ledgers.current(ledger);
      if (existing) {
        log$8.info('Ledger was already registered: %s', ledger);
      } else {
        const transaction = ledgers.transaction();
        // TODO: assert amount = 0
        await StateMachine(transaction)
          .getPayloads(payload)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.continuePayload())
          .then(t => t.addSystemSignatures())
          .then(t => t.addSignatures({ ledger, ...registration }))
          .then(t => t.save());
        transaction.putKey({
          ledger,
          publicKeyArmored,
          alias,
          challenge: payload
        });
        await transaction.execute();
        log$8.info('Registered ledger %s in database', ledger);
      }
      const user = await userpool.findUser(username);
      if (!user) {
        throw new Error(`User ${username} not found in userpool.`)
      }
      if (user.ledger) {
        if (user.ledger === ledger) {
          log$8.info(
            'User account %s already attached to ledger %s',
            username,
            ledger
          );
        } else {
          throw new Error(
            `Username ${username} is already linked to ledger ${user.ledger}, unable to re-link to ${ledger}`
          )
        }
      } else {
        userpool.changeAttributes(username, { 'custom:ledger': ledger });
      }
      return ledger
    },
    async forceSystemPayment (ledger, amount) {
      log$8.debug('Forcing system payment of %s on ledger %s', amount, ledger);
      const pending = await ledgers.pending(ledger);
      if (pending) {
        if (pending.destination === 'system') {
          // idempotency, we assume the client re-submitted
          return 'succes'
        } else {
          throw new Error(
            `There is still a pending transaction on ledger ${ledger}`
          )
        }
      }
      ledgers.keys('system', true);
      const transaction = ledgers.transaction();
      await StateMachine(transaction)
        .getSources({ ledger, destination: 'system' })
        .then(t => t.addAmount(amount))
        .then(t => t.addSystemSignatures())
        .then(t => t.save())
        .catch(err => log$8.error('Forced system payment failed\n%s', err));
      await transaction.execute();
      return `Success`
    },
    async jubilee (paginationToken) {
      const results = {
        ledgers: 0,
        demurrage: mani$1(0),
        income: mani$1(0)
      };
      // convert to a key-value(s) object for easy lookup
      const types = userpool
        .getAccountTypes()
        .reduce((acc, { type, ...attr }) => {
          acc[type] = attr;
          return acc
        }, {});
      async function applyJubilee (ledger, DI) {
        log$8.debug('Applying jubilee to ledger %s', ledger);
        const transaction = ledgers.transaction();
        await StateMachine(transaction)
          .getSources({ ledger, destination: 'system' })
          .then(t => t.addDI(DI))
          .then(t => {
            const entry = t.getPrimaryEntry();
            results.income = results.income.add(entry.income);
            results.demurrage = results.demurrage.add(entry.demurrage);
            results.ledgers++;
            return t
          })
          .then(t => t.addSystemSignatures())
          .then(t => t.save())
          .catch(log$8.error);
        await transaction.execute();
        log$8.debug('Jubilee succesfully applied to ledger %s', ledger);
      }
      const {
        users,
        paginationToken: nextToken
      } = await userpool.listJubileeUsers(paginationToken);
      for (let { ledger, type } of users) {
        const DI = type ? types[type] : types['default'];
        if (!DI) {
          log$8.error(
            'SKIPPING JUBILEE: Unable to determine jubilee type %s for ledger %s',
            type,
            ledger
          );
        } else {
          log$8.debug('Applying jubilee of type %s to ledger %s', type, ledger);
          // these for loops allow await!
          await applyJubilee(ledger, DI);
        }
      }
      return {
        paginationToken: nextToken,
        ...results
      }
    }
  }
}

serverLog.getLogger('dynamodb:ledger');
/**
 * Specialized view on a single ledger.
 */

function ledger (ledgers, fingerprint) {
  return {
    fingerprint,
    async current (required = false) {
      return ledgers.current(fingerprint, required)
    },
    async pending (required = false) {
      return ledgers.pending(fingerprint, required)
    },
    async recent () {
      return ledgers.recent(fingerprint)
    },
    async entry (entry, required = false) {
      return ledgers.entry(fingerprint, entry, required)
    },
    short () {
      return ledger(ledgers.short(), fingerprint)
    }
  }
}

const log$7 = serverLog.getLogger('core:transactions');

/**
 * Operations on a single ledger.
 */
var Transactions = (ledgers, fingerprint) => {
  const ledger$1 = ledger(ledgers, fingerprint);
  const { current, pending, recent, short } = ledger$1;
  return {
    fingerprint,
    current,
    pending,
    recent,
    short,
    async challenge (destination, amount) {
      return StateMachine(ledgers)
        .getSources({ ledger: fingerprint, destination })
        .then(t => t.addAmount(amount))
        .then(t => t.getPrimaryEntry().challenge)
    },
    async create (proof) {
      const existing = await ledger$1.pending();
      if (existing && existing.challenge === proof.payload) {
        log$7.info(`Transaction ${proof.payload} was already created`);
        return existing.next // idempotency
      }
      let next;
      const transaction = ledgers.transaction();
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .getPayloadSources()
        .then(t => t.continuePayload())
        .then(t => t.addSignatures({ ledger: fingerprint, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next;
          return t
        })
        .then(t => t.save());
      await transaction.execute();
      return next
    },
    async confirm (proof) {
      // proof contains signature, counterSignature, payload
      const existing = await ledger$1.current();
      if (existing && existing.challenge === proof.payload) {
        log$7.info(`Transaction ${proof.payload} was already confirmed`);
        return existing.next // idempotency
      }
      let next;
      const transaction = ledgers.transaction();
      await StateMachine(transaction)
        .getPayloads(proof.payload)
        .continuePending()
        .then(t => t.addSignatures({ ledger: fingerprint, ...proof }))
        .then(t => {
          next = t.getPrimaryEntry().next;
          log$7.debug('Primary entry: %j', t.getPrimaryEntry());
          return t
        })
        .then(t => t.save());
      await transaction.execute();
      return next
    },
    async cancel (challenge) {
      const pending = await ledger$1.pending();
      if (pending && pending.challenge === challenge) {
        if (pending.destination === 'system') {
          throw new Error('System transactions cannot be cancelled.')
        }
        const destination = await ledgers.pendingEntry(pending.destination);
        if (!destination) {
          throw new Error(
            'No matching transaction found on destination ledger, please contact system administrators.'
          )
        }
        const transaction = ledgers.transaction();
        transaction.deletePending(fingerprint);
        transaction.deletePending(pending.destination);
        await transaction.execute();
        return 'Pending transaction successfully cancelled.'
      } else {
        return 'No matching pending transaction found, it may have already been cancelled or confirmed.'
      }
    }
  }
};

const log$6 = serverLog.getLogger('dynamodb:table');
const methods = ['get', 'put', 'query', 'update'];

/**
 * This helps significantly reduce the amount of DynamoDB code duplication. Essentially, it reuses the TableName and automatically constructs typical DynamoDB commands from input parameters and regular methods.
 *
 * By using `transaction()`, a similar set of functions is available, except the entire transaction (set of commands) needs to be executed at the end.
 */

const table = function (db, options = {}) {
  const TableName = process.env.DYN_TABLE;
  if (!TableName) {
    throw new Error('Please set ENV variable DYN_TABLE.')
  }
  const t = methods.reduce(
    (table, method) => {
      table[method] = async param => {
        const arg = {
          TableName,
          ...param,
          ...options
        };
        return db[method](arg)
      };
      return table
    },
    {}
  );
  async function getItem (Key, errorMsg) {
    log$6.debug('Getting item: \n%j', Key);
    try {
      const result = await t.get({ Key });
      if (errorMsg && !result.Item) {
        throw errorMsg
      }
      log$6.debug('Found item: %o', result.Item);
      return tools.fromDb(result.Item)
    } catch (err) {
      log$6.error(err);
      throw err
    }
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
            }
          });
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
            log$6.error('Error executing transaction: %j', result.err);
            throw result.err
          }
          log$6.debug('Database updated:\n%j', TransactItems);
          return TransactItems.length
        },
        transaction () {
          throw new Error(`Already in a transaction`)
        }
      }
    }
  }
};

const log$5 = serverLog.getLogger('dynamodb:ledgers');

/**
 * Specialized functions to strictly work with ledgers. Continues building on table.
 */

function ledgers (table, prefix = '') {
  const skip = prefix.length;
  async function entry (fingerprint, entry, required = false) {
    const item = await table.getItem(
      { ledger: prefix + fingerprint, entry },
      required ? `Entry ${entry} not found for ledger ${fingerprint}` : undefined
    );
    if (item) {
      item.ledger = item.ledger.substring(skip); // strip the prefix
    }
    return item
  }
  return {
    async current (fingerprint, required = false) {
      return entry(fingerprint, '/current', required)
    },
    async pending (fingerprint, required = false) {
      return entry(fingerprint, 'pending', required)
    },
    entry,
    async putEntry (entry) {
      assert__default['default'](entry instanceof Object);
      entry.ledger = prefix + entry.ledger;
      return table.putItem(entry)
    },
    async deletePending (fingerprint) {
      return table.deleteItem({ ledger: prefix + fingerprint, entry: 'pending' })
    },
    async keys (fingerprint, required = false) {
      return table.getItem(
        { ledger: fingerprint, entry: 'pk' },
        required ? `Key(s) not found for ledger ${fingerprint}` : undefined
      )
    },
    async publicKey (fingerprint) {
      return table.attributes(['ledger', 'publicKeyArmored', 'alias']).getItem({ ledger: fingerprint, entry: 'pk' })
    },
    async putKey (key) {
      key.entry = 'pk';
      return table.putItem(key)
    },
    async recent (fingerprint) {
      log$5.debug('ledger = %s AND begins_with(entry,/)', fingerprint);
      return table.queryItems({
        KeyConditionExpression:
          'ledger = :ledger AND begins_with(entry, :slash)',
        ExpressionAttributeValues: {
          ':ledger': fingerprint,
          ':slash': '/'
        }
      })
    },
    short () {
      // to reduce the size of the results, we can limit the attributes requested (omitting the signatures, which are fairly large text fields).
      return ledgers(table.attributes([
        'ledger',
        'destination',
        'amount',
        'balance',
        'date',
        'payload',
        'next',
        'sequence',
        'uid',
        'income',
        'demurrage',
        'challenge'
      ]), prefix)
    },
    transaction () {
      return ledgers(table.transaction(), prefix)
    },
    items () {
      return table.items()
    },
    async execute () {
      return table.execute()
    }
  }
}

const mani = (table) => ledgers(table, '');

function Core (db, userpool) {
  const table$1 = table(db);
  const ledgers = mani(table$1);
  return {
    system: () => System(ledgers, userpool),
    mani: (fingerprint) => Transactions(ledgers, fingerprint)
  }
}

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
    "Number of ledgers process in this batch"
    ledgers: Int!
    "Demurrage removed in this batch"
    demurrage: Currency!
    "Income added in this batch"
    income: Currency!
    "If the process is not finished yet (more batches available), it returns a paginationToken"
    nextToken: String
  }

  type User {
    alias: String
    sub: String
    email: String
    email_verified: StringBoolean
    administrator: StringBoolean
    status: String
    enabled: Boolean
    created: DateTime
    lastModified: DateTime
    ledger: String
    type: String
    requestedType: String 
  }

  type AccountType {
    type: String!
    income: Currency!
    buffer: Currency!
    demurrage: Float!
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
    "Find a user by username (email address)"
    finduser(username: String!): User
    "Show the available account types"
    accountTypes: [AccountType]!
  }

  type Admin {
    "apply demurrage and (basic) income to all accounts"
    jubilee(paginationToken: String): Jubilee!
    "Initialize the system"
    init: String
    "Change the type of the account associated with this username (email address)"
    changeAccountType(username: String, type: String): String
    "Disable user account"
    disableAccount(username: String): String
    "Enable user account"
    enableAccount(username: String): String
    "Force a system payment"
    forceSystemPayment(ledger: String!, amount: Currency!): String
  }

  type Query {
    # access to system internals
    system: System!
  }

  type Mutation {
    admin: Admin
  }
`;

var transactions$1 = apolloServerLambda.gql`
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
  scalar StringBoolean
  
  type Query {
    time: DateTime!
  }
`;

var typeDefs = merge.mergeTypeDefs([schema, SystemSchema, transactions$1]);

const currency = new graphql.GraphQLScalarType({
  name: 'Currency',
  description: 'Custom scalar type for working consistently with currency-style fractions',
  // value sent to the client
  serialize (value) {
    if (value instanceof Mani) {
      return value.format()
    } else {
      // note that this is quite permissive and will even allow something like "MANI 10 00,5" as input
      return mani$1(value).format()
    }
  },
  // value from the client
  parseValue (value) {
    return mani$1(value)
  },
  // value from client in AST representation
  parseLiteral (ast) {
    if (ast.kind !== language.Kind.STRING || ast.kind !== language.Kind.INT || ast.kind !== language.Kind.FLOAT) {
      throw new TypeError(
        `Unknown representation of currency ${'value' in ast && ast.value}`
      )
    }
    return mani$1(ast.value)
  }
});

var StringBoolean = new graphql.GraphQLScalarType({
  name: 'StringBoolean',
  description: 'Custom scalar type for working consistently with booleans that are represented by strings internally',
  // value sent to the client
  serialize (value) {
    return value === 'true'
  },
  // value from the client
  parseValue (value) {
    return `${value}`
  },
  // value from client in AST representation
  parseLiteral (ast) {
    if (ast.kind !== language.Kind.BOOLEAN) {
      throw new TypeError(
        `Unknown representation of boolean ${'value' in ast && ast.value}`
      )
    }
    return `${ast.value}`
  }
});

const log$4 = serverLog.getLogger('graphql:system');

var system = {
  Query: {
    system: (_, args, { core }) => {
      return core.system()
    }
  },
  Mutation: {
    admin: (_, args, { core, admin, ledger, claims }) => {
      if (!admin) {
        log$4.error(`Illegal system access attempt by ${ledger}`);
        throw new apolloServer.ForbiddenError('Access denied')
      }
      // TODO: log claims
      return core.system()
    }
  },
  System: {
    register: async (system, { registration }, { username }) => {
      // TODO: [LORECO-95] username = undefined
      return system.register(registration, username)
    },
    parameters: async system => {
      return system.parameters()
    },
    challenge: async system => {
      return system.challenge()
    },
    findkey: async (system, { id }) => {
      return system.findkey(id)
    },
    finduser: async (system, { username }) => {
      return system.findUser(username)
    },
    accountTypes: async system => {
      return system.getAccountTypes()
    }
  },
  Admin: {
    init: async system => {
      return system.init()
    },
    jubilee: async (system, { paginationToken }) => {
      return system.jubilee(paginationToken)
    },
    changeAccountType: async (system, { username, type }) => {
      const result = await system.changeAccountType(username, type);
      log$4.debug(
        'Changed account %s to type %s, result %j',
        username,
        type,
        result
      );
      return `Changed account type of ${username} to ${type}`
    },
    disableAccount: async (system, { username }) => {
      const result = await system.disableAccount(username);
      log$4.debug('Disabled account %s, result %j', username, result);
      return `Disabled account ${username}`
    },
    enableAccount: async (system, { username }) => {
      const result = await system.enableAccount(username);
      log$4.debug('Enabled account %s, result %j', username, result);
      return `Enabled account ${username}`
    },
    forceSystemPayment: async (system, { ledger, amount }) => {
      const result = await system.forceSystemPayment(ledger, amount);
      return `Forced system payment of ${amount} on ledger ${ledger}, result: ${result}`
    }
  }
};

const log$3 = serverLog.getLogger('graphql:transactions');

var transactions = {
  Query: {
    ledger: (_, { id }) => {
      return id // optional: check if this even exists?
    }
  },
  LedgerQuery: {
    transactions: (id, arg, { core, ledger, admin }) => {
      if (id !== ledger && !admin) {
        const err = `Illegal access attempt detected from ${ledger} on ${id}`;
        log$3.error(err);
        throw new apolloServer.ForbiddenError(err)
      }
      return core.mani(id)
    }
  },
  TransactionQuery: {
    current: async transactions => {
      return transactions.short().current()
    },
    pending: async transactions => {
      const pending = await transactions.pending();
      if (pending) {
        return {
          ...pending,
          message: 'Pending',
          toSign: _.isEmpty(pending.signature)
        }
      }
    },
    recent: async transactions => {
      log$3.debug(
        'recent transactions requested for %s',
        transactions.fingerprint
      );
      return transactions.short().recent()
    },
    challenge: async (transactions, { destination, amount }) => {
      return transactions.challenge(destination, amount)
    },
    create: async (transactions, { proof }) => {
      return transactions.create(proof)
    },
    confirm: async (transactions, { proof }) => {
      return transactions.confirm(proof)
    },
    cancel: async (transactions, { challenge }) => {
      return transactions.cancel(challenge)
    }
  }
};

var resolvers = _.merge(
  {
    DateTime: graphqlScalars.DateTimeResolver,
    NonNegativeFloat: graphqlScalars.NonNegativeFloatResolver
  },
  { Currency: currency, StringBoolean },
  {
    Query: {
      time: () => new Date(Date.now())
    }
  },
  system,
  transactions
);

const log$2 = serverLog.getLogger('cognito');

const CognitoUserPool = UserPoolId => {
  const USER_LIST_LIMIT = parseInt(process.env.COGNITO_LIMIT) || 20;
  log$2.debug(
    'Cognito configured with user pool %s and list limit %n',
    UserPoolId,
    USER_LIST_LIMIT
  );
  const convertAttributes = (attr = []) =>
    attr.reduce((acc, att) => {
      acc[att.Name.replace('custom:', '')] = att.Value;
      return acc
    }, {});
  const convertUser = ({ Attributes, UserAttributes, ...user }) => {
    const {
      Username: username,
      UserStatus: status,
      UserCreateDate: created,
      UserLastModifiedDate: lastModified,
      Enabled: enabled
    } = user;
    return {
      username,
      status,
      created,
      lastModified,
      enabled,
      ...convertAttributes(Attributes), // this is what listUsers uses...
      ...convertAttributes(UserAttributes) // ... and this is what adminGetUser uses
    }
  };
  const provider = new AWS__default['default'].CognitoIdentityServiceProvider();
  return {
    getAccountTypes () {
      const config = process.env.ACCOUNT_TYPES;
      if (!config) {
        log$2.error('Missing ACCOUNT_TYPES ENV variable');
        return []
      }
      return JSON.parse(config).map(({ income, buffer, ...type }) => ({
        ...type,
        buffer: mani$1(buffer),
        income: mani$1(income)
      }))
    },
    async disableUser (Username) {
      provider.adminDisableUser = util.promisify(provider.adminDisableUser);
      return provider.adminDisableUser({
        UserPoolId,
        Username
      })
    },
    async enableUser (Username) {
      provider.adminEnableUser = util.promisify(provider.adminEnableUser);
      return provider.adminEnableUser({
        UserPoolId,
        Username
      })
    },
    async changeAttributes (Username, attributes) {
      provider.adminUpdateUserAttributes = util.promisify(
        provider.adminUpdateUserAttributes
      );
      const UserAttributes = Object.entries(attributes).map(([Name, Value]) => {
        return { Name, Value }
      });
      return provider.adminUpdateUserAttributes({
        UserPoolId,
        Username,
        UserAttributes
      })
    },
    async listJubileeUsers (PaginationToken) {
      provider.listUsersPromise = util.promisify(provider.listUsers);
      const params = {
        UserPoolId,
        PaginationToken,
        Limit: USER_LIST_LIMIT
        // AttributesToGet: [
        // 'sub',
        // 'username',
        // 'cognito:user_status',
        // 'status',
        // 'custom:ledger',
        // 'custom:type'
        // ] // TODO: add extra verification/filters?
      };
      const res = await provider.listUsersPromise(params);
      if (res.err) {
        throw res.err
      }
      log$2.debug('Found %n users', res.Users.length);
      return {
        users: res.Users.map(convertUser),
        paginationToken: res.PaginationToken
      }
    },
    async findUser (Username) {
      provider.adminGetUser = util.promisify(provider.adminGetUser);
      const result = await provider.adminGetUser({ UserPoolId, Username });
      if (result) {
        log$2.debug('Cognito result: %j', result);
        const user = convertUser(result);
        log$2.debug('User: %j', user);
        return user
      }
    }
  }
};

const log$1 = serverLog.getLogger('lambda:offlineuserpool');

/**
 * For offline development only!
 *
 * Expected format of user records:
 *
 * { ledger: '<fingerprint>'}
 */
const OfflineUserPool = (path = '.jubilee.users.json') => {
  const contents = fs__default['default'].readFileSync(path, { encoding: 'utf-8' });
  if (!contents) log$1.error(`Please make sure ${path} is present`);
  const jubilee = JSON.parse(contents);
  log$1.info(`Loaded jubilee users from ${path}`);
  return {
    // Users that have been added to the "jubilee" group
    async listJubileeUsers () {
      return jubilee
    }
  }
};

const log = serverLog.getLogger('lambda:handler');

const debug = process.env.DEBUG === 'true';
const offline = process.env.IS_OFFLINE === 'true';
const userpool = process.env.USER_POOL_ID || process.env.USER_POOL;
const systemInit = process.env.AUTO_SYSTEM_INIT === 'true';

log.debug('USERPOOL %j', process.env.USER_POOL_ID);

function contextProcessor (event) {
  const { headers } = event;
  log.debug('Context Event: %j', event);
  // fake the cognito interface if offline
  let claims = offline
    ? JSON.parse(headers['x-claims'] || process.env.CLAIMS)
    : event.requestContext.authorizer.jwt.claims;
  log.debug('User claims: %j', claims);
  return {
    ledger: claims['custom:ledger'],
    verified: claims.email_verified,
    admin: claims['custom:administrator'],
    username: claims.sub,
    claims
  }
}

const offlineOptions = offline
  ? {
      endpoint: 'http://localhost:8000',
      httpOptions: { agent: new http__default['default'].Agent({ keepAlive: true }) }
    }
  : {};

const core = Core(
  dynamoPlus.DynamoPlus({
    region: process.env.DYN_REGION,
    ...offlineOptions,
    maxRetries: 3
  }),
  userpool ? CognitoUserPool(userpool) : OfflineUserPool()
);

if (systemInit) {
  log.info('Automatically initializing system');
  core.system().init();
}

log.info('Starting ApolloServer (debug: %s, offline: %s)', debug, offline);
log.debug('ENV variables: %j', process.env);
const server = new apolloServerLambda.ApolloServer({
  debug,
  introspection: debug,
  typeDefs,
  resolvers,
  plugins: [serverLog.apolloLogPlugin, apolloServerCore.ApolloServerPluginLandingPageGraphQLPlayground()],
  cors: false,
  context: async ({ event, context }) => {
    return {
      core,
      ...contextProcessor(event)
    }
  }
});

const handler = server.createHandler();

async function debugHandler (event, context) {
  // log.debug('event: %j', event)
  // log.debug('context: %j', context)
  return handler(event, context)
}

exports.graphqlHandler = debug ? debugHandler : handler;
