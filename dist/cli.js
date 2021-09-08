#!/usr/bin/env node
'use strict';

var inquirer = require('inquirer');
var log$1 = require('loglevel');
var core = require('@apollo/client/core');
var _ = require('lodash');
var AsyncStorage = require('@react-native-async-storage/async-storage');
var openpgp = require('openpgp');
require('assert');
require('sha1');
var currency = require('currency.js');
require('react');
var client = require('@apollo/client');
var Storage = require('dom-storage');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var log__default = /*#__PURE__*/_interopDefaultLegacy(log$1);
var AsyncStorage__default = /*#__PURE__*/_interopDefaultLegacy(AsyncStorage);
var currency__default = /*#__PURE__*/_interopDefaultLegacy(currency);
var Storage__default = /*#__PURE__*/_interopDefaultLegacy(Storage);

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
      privateKey = privateKey === undefined ? await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey }) : privateKey; // lazy loaded
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
      publicKey = publicKey === undefined ? await openpgp.readKey({ armoredKey: armoredPublicKey }) : publicKey; // lazy loaded
      await openpgp.verify({
        message: await openpgp.createMessage({ text }),
        signature: await openpgp.readSignature({ armoredSignature }),
        verificationKeys: publicKey,
        expectSigned: true // automatically throws an error
      });
      return true
    },
    fingerprint: async () => {
      if (!fingerprint) {
        publicKey = publicKey === undefined ? await openpgp.readKey({ armoredKey: armoredPublicKey }) : publicKey; // lazy loaded
        fingerprint = publicKey.getFingerprint();
      }
      return fingerprint
    }
  }
};

const KeyWrapper = (key) => {
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

// interface for keys

const KeyManager = async store => {
  const storedKeys = await store.getKeys();
  let keys;
  if (storedKeys) {
    log__default['default'].info('Stored keys found');
    keys = KeyWrapper(storedKeys);
  }
  async function getKeys () {
    if (!keys) {
      keys = await KeyGenerator().generate();
      keys.ledger = await keys.publicKey.fingerprint();
      log__default['default'].info('New keys generated');
      store.saveKeys(keys);
      log__default['default'].info('New keys saved to store');
    }
    return keys
  }
  async function sign (payload) {
    return (await getKeys()).privateKey.sign(payload)
  }
  async function fingerprint () {
    return (await getKeys()).publicKey.fingerprint()
  }
  return {
    getKeys,
    fingerprint,
    sign
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
function entryPath (entry) {
  return `/${pad(entry.sequence)}/${entry.uid}`
}
function path (entry) {
  return `/${entry.ledger}${entryPath(entry)}`
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
      (key === 'amount' || key === 'balance' || key === 'income') &&
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

const TIME = client.gql`
  query {
    time
  }
`;

const REGISTER = client.gql`
  query($registration: LedgerRegistration!) {
    system {
      register(registration: $registration)
    }
  }
`;
const SYSTEM_CHALLENGE = client.gql`
  query {
    system {
      challenge
    }
  }
`;
const CURRENT = client.gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        current {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
        }
      }
    }
  }
`;
const RECENT = client.gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        recent {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
        }
      }
    }
  }
`;
const PENDING = client.gql`
  query ledger($id: String!) {
    ledger(id: $id) {
      transactions {
        pending {
          ledger
          destination
          amount
          income
          demurrage
          balance
          date
          challenge
          message
          toSign
        }
      }
    }
  }
`;
const CHALLENGE = client.gql`
  query challenge($id: String!, $destination: String!, $amount: Currency!) {
    ledger(id: $id) {
      transactions {
        challenge(destination: $destination, amount: $amount)
      }
    }
  }
`;
const CREATE = client.gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        create(proof: $proof)
      }
    }
  }
`;
const CONFIRM = client.gql`
  query ledger($id: String!, $proof: Proof!) {
    ledger(id: $id) {
      transactions {
        confirm(proof: $proof)
      }
    }
  }
`;
const CANCEL = client.gql`
  query ledger($id: String!, $challenge: String!) {
    ledger(id: $id) {
      transactions {
        cancel(challenge: $challenge)
      }
    }
  }
`;
const FIND_KEY = client.gql`
  query findkey($id: String!) {
    system {
      findkey(id: $id) {
        alias
        publicKeyArmored
      }
    }
  }
`;
const JUBILEE = client.gql`
  mutation jubilee($ledger: String) {
    admin {
      jubilee(ledger: $ledger) {
        ledgers
        demurrage
        income
      }
    }
  }
`;
const SYSTEM_PARAMETERS = client.gql`
  query {
    system {
      parameters {
        income
        demurrage
      }
    }
  }
`;
const INIT = client.gql`
  mutation init {
    admin {
      init
    }
  }
`;

// const log = require('util').debuglog('Transactions')

const log = msg => log__default['default'].error(msg);

const storageKey = 'mani_client_key';

function defaultContext () {
  return {}
}
const defaultKeyStore = {
  async getKeys () {
    try {
      const key = await AsyncStorage__default['default'].getItem(storageKey);
      if (key !== null) {
        // key previously stored
        return JSON.parse(key)
      }
    } catch (e) {
      // error reading key
      log(e);
    }
  },
  async saveKeys (keys) {
    try {
      await AsyncStorage__default['default'].setItem(storageKey, JSON.stringify(keys));
    } catch (e) {
      // saving error
      log(e);
    }
  }
};

const ManiClient = async ({
  graphqlClient,
  keyStore = defaultKeyStore,
  fail = true,
  contextProvider = defaultContext
}) => {
  const keyManager = await KeyManager(keyStore);
  const id = await keyManager.fingerprint();
  async function query (query, path, variables = {}, required = true) {
    const result = await graphqlClient.query({
      query,
      variables,
      context: contextProvider(),
      fetchPolicy: 'no-cache'
    });
    if (result.errors) {
      log(result.errors);
      if (fail) throw new Error(result.errors)
    }
    const obj = _.get(result.data, path);
    if (required && fail && !obj) {
      throw new Error(
        `Could not find ${path} in\n${JSON.stringify(result.data)}`
      )
    }
    return obj
  }
  async function find (ledger) {
    return query(FIND_KEY, 'system.findkey.alias', { id: ledger }, false)
  }
  async function register (alias) {
    const challenge = await query(SYSTEM_CHALLENGE, 'system.challenge');
    const payload = challenge.replace('<fingerprint>', id);
    return query(REGISTER, 'system.register', {
      registration: {
        publicKeyArmored: (await keyManager.getKeys()).publicKeyArmored,
        alias,
        signature: await keyManager.sign(payload),
        counterSignature: await keyManager.sign(flip(payload)),
        payload
      }
    })
  }
  const transactions = {
    async recent () {
      const recent = await query(RECENT, 'ledger.transactions.recent', {
        id
      });
      // log(JSON.stringify(recent, null, 2))
      return fromDb(recent)
    },
    async current () {
      const current = await query(CURRENT, 'ledger.transactions.current', {
        id
      });
      // log(JSON.stringify(current, null, 2))
      return fromDb(current)
    },
    async pending () {
      const pending = await query(
        PENDING,
        'ledger.transactions.pending',
        { id },
        false
      );
      return fromDb(pending)
    },
    async confirm (challenge) {
      return query(CONFIRM, 'ledger.transactions.confirm', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        }
      })
    },
    async challenge (destination, amount) {
      return query(CHALLENGE, 'ledger.transactions.challenge', {
        id,
        destination,
        amount: amount.format()
      })
    },
    async create (challenge) {
      return query(CREATE, 'ledger.transactions.create', {
        id,
        proof: {
          signature: await keyManager.sign(challenge),
          counterSignature: await keyManager.sign(flip(challenge)),
          payload: challenge
        }
      })
    },
    async cancel (challenge) {
      return query(CANCEL, 'ledger.transactions.cancel', {
        id,
        challenge
      })
    }
  };
  const system = {
    async parameters () {
      return fromDb(
        await query(SYSTEM_PARAMETERS, 'system.parameters', {}, false)
      )
    }
  };
  const admin = {
    async jubilee () {
      return fromDb(await query(JUBILEE, 'admin.jubilee', { ledger: id }))
    },
    async init () {
      return query(INIT, 'admin.init')
    }
  };
  return {
    getTime: async () => query(TIME, 'time'),
    id,
    register,
    find,
    transactions,
    system,
    admin
  }
};

/**
 * For demonstration and testing purposes: we fake a LocalStorage such as what you'd find in a browser.
 */
const KeyStorage = (path = './.manipona.keys.json') => {
  const localStorage = new Storage__default['default'](path, { strict: false });
  return {
    getKeys () {
      const keys = localStorage.getItem('pk');
      if (keys) log__default['default'].info(`Keys found for ledger ${keys.ledger}`);
      return keys
    },
    saveKeys ({ ledger, publicKeyArmored, privateKeyArmored }) {
      localStorage.setItem('pk', { ledger, publicKeyArmored, privateKeyArmored });
    }
  }
};

global.fetch = require('node-fetch');

log__default['default'].setLevel('info');

/**
 * FOR DEMONSTRATION PURPOSES ONLY.
 */
console.log('FOR DEMONSTRATION PURPOSES ONLY. WILL NOT WORK WITH (SECURED) SUMSY ENDPOINTS, ONLY WITH OFFLINE (LOCALHOST) INSTANCES.');

async function cli () {
  const { uri } = await inquirer__default['default'].prompt([{
    type: 'input',
    name: 'uri',
    message: 'URI of mani pona endpoint',
    default: 'http://localhost:3000/dev/graphql'
  }]);
  const keyStore = KeyStorage();
  const context = (() => {
    let ledger = '';
    return {
      setLedger (l) {
        ledger = l;
      },
      provider () {
        return {
          headers: {
            'x-claims': JSON.stringify({ sub: ledger, verified: true, admin: true })
          }
        }
      }
    }
  })();
  const graphqlClient = new core.ApolloClient({ uri, cache: new core.InMemoryCache() });
  const client = await ManiClient({ graphqlClient, keyStore, contextProvider: context.provider });
  context.setLedger(client.id);
  log__default['default'].info(`Initialized with ledger ${client.id}`);
  const alias = await client.find(client.id);
  const parameters = await client.system.parameters();
  if (parameters) {
    console.log(`SuMSy running with income of ${parameters.income.format()} and ${parameters.demurrage}% demurrage.`);
  } else {
    console.log(`Initializing SuMSy`);
    const init = await client.admin.init();
    console.log(init);
  }
  async function pendingLoop () {
    const pending = await client.transactions.pending();
    if (pending) {
      // log.info(`Pending transaction: ${JSON.stringify(pending)}`)
      if (pending.destination === 'system') {
        // these can't be cancelled
        log__default['default'].info(`A Jubilee occurred: ${pending.demurrage.format()} demurrage and ${pending.income.format()} income is automatically confirmed`);
        await client.transactions.confirm(pending.challenge);
      } else {
        // log.info(`Pending transaction: ${JSON.stringify(pending, null, 2)}`)
        if (pending.toSign) {
          const { confirmation } = await inquirer__default['default'].prompt({
            type: 'confirm',
            name: 'confirmation',
            message: `A transaction of ${pending.amount.format()} was initiated by ledger ${pending.destination}, do you accept?`,
            default: true
          });
          if (confirmation) {
            await client.transactions.confirm(pending.challenge);
          } else {
            await client.transactions.cancel(pending.challenge);
          }
          return true
        } else {
          const { cancel } = await inquirer__default['default'].prompt({
            type: 'confirm',
            name: 'cancel',
            message: `You have a transaction pending (${pending.amount.format()}), waiting for confirmation by ledger ${pending.destination}, do you wish to cancel?`,
            default: false
          });
          if (cancel) {
            await client.transactions.cancel(pending.challenge);
            return true
          } else {
            return false
          }
        }
      }
    } else {
      log__default['default'].info('No pending transactions');
      return true
    }
  }
  async function createTransaction () {
    const { destination } = await inquirer__default['default'].prompt({ type: 'input', message: 'Please provide the destination ledger:', name: 'destination' });
    if (destination) {
      let { amount } = await inquirer__default['default'].prompt({ type: 'number', message: 'Please provide an amount:', name: 'amount' });
      if (amount) {
        amount = mani(amount);
        const challenge = await client.transactions.challenge(destination, amount);
        await client.transactions.create(challenge);
        log__default['default'].info(`Transaction is pending`);
      }
    }
  }
  async function promptLoop () {
    const { command } = await inquirer__default['default'].prompt([{
      type: 'list',
      name: 'command',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Create new transaction (n)', value: 'new', short: 'n' },
        { name: 'Check pending transactions (p)', value: 'pending', short: 'p' },
        { name: 'Current account balance (c)', value: 'current', short: 'c' },
        { name: 'Execute jubilee (j)', value: 'jubilee', short: 'j' },
        { name: 'Exit (x)', value: 'exit', short: 'x' }
      ]
    }]);
    switch (command) {
      case 'new':
        const nopending = await pendingLoop();
        if (nopending) await createTransaction();
        break
      case 'pending':
        await pendingLoop();
        break
      case 'current':
        await pendingLoop();
        const current = await client.transactions.current();
        console.log(`Your current account balance is ${current.balance.format()} (last updated: ${current.date.toLocaleString('nl-BE')})`);
        break
      case 'jubilee':
        const possible = await pendingLoop();
        if (possible) {
          const jubilee = await client.admin.jubilee();
          console.log(`Deducted ${jubilee.demurrage.format()} demurrage and added ${jubilee.income.format()} total to ${jubilee.ledgers} ledgers`);
        }
        break
      case 'exit':
        log__default['default'].info('Exiting the client, goodbye');
        process.exit();
    }
    return promptLoop()
  }
  if (alias) {
    console.log(`Welcome back, ${alias}`);
    await promptLoop();
  } else {
    const { alias } = await inquirer__default['default'].prompt({
      type: 'input',
      name: 'alias',
      default: 'Mr. Robot',
      message: 'Please provide an alias' });
    const fingerprint = await client.register(alias);
    log__default['default'].info(`Succesfully registered ledger ${fingerprint}`);
    await promptLoop();
  }
}

cli().catch(console.error);
