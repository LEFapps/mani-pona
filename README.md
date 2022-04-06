# Loreco

## Table of contents
- [About](#about)
- [Key terms](#key-terms)
- [Principles](#principles)
  - [Forward Signing](#forward-signing)
  - [Trust Validation](#trust-validation)
  - [Using public keys as ID's](#using-public-keys-as-ids)
  - [Transactions](#transactions)
    - [Transaction creation](#transaction-creation)
    - [Transaction confirmation](#transaction-confirmation)
    - [System transactions](#system-transactions)
    - [Initial transaction and oroborous signing](#initial-transaction-and-oroborous-signing)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Running the application](#running-the-application)
    - [Running DynamoDB](#running-dynamodb)
    - [Running GraphQL](#running-graphql)
    - [Running the CLI tool](#running-the-cli-tool)
  - [Running the test suite](#running-the-test-suite)
  - [Running the frontend only](#running-the-frontend-only)
  - [Deploying changes](#deploying-changes)
    - [Deploying frontend changes](#deploying-frontend-changes)
- [Stack and Infrastructure](#stack-and-infrastructure)
- [Data structure](#data-structure)
- [File structure](#file-structure)
- [Functions](#functions)

## About

Loreco is an application supporting an alternative economic system. It allows users to maintain a ledger and carry out transactions using a digital currency (mani). The main features of Loreco are a __guaranteed basic income__, a system of __demurrage__, a unique __cryptographic__ system and user __security__ all outlined below.

The application also has a dashboard for administrators to aid the various processes.

## Key terms
- __mani__: The term for the currency used/created by the application. This currency can be renamed in the front-end but in this repository, as well as this documentation, will be referred to as `mani`

## Principles

Loreco is an implementation of the "Sustainable Money System". This repository contains a centralized implementation, although the ledgers are designed with a potential decentralized implementation and migration in mind.

Loreco is __not__ a blockchain-based currency. Although it uses cryptographic functions to ensure data integrity, its ledger design is completely different from the blockchain approach. The core concepts to understand this project are __forward signing__ and __trust validation__. So, an appropriate term would be __forward signing ledger__.

### Forward Signing

Loreco uses an individual ledger per user (even if they may use the same database in the centralized implementation). 
These ledgers are __sequential series__ of (monetary) transactions.
However, every transaction ("line" in the ledger) contains a __(double-)signed reference__ to the __previous transaction__ in the same ledger.
This makes it __impossible__ to __remove__ or __alter__ historical transactions in a ledger without destroying its internal consistency.
Since the __cryptographic signatures__ are based on a hash of the signature(s) as well as the sequence number of the previous transaction(s), plus date and amount, the ledger becomes an __"unbreakable chain"__.

To sign transactions, Loreco uses __public/private key signing__, where the user is in __full control__ of their own private key.
This implies a few things:

  - Loss of this private key functionally __eliminates__ a ledger. It is impossible to create an internally consistent transaction on a ledger without the private + public keys.

  - Even with full server-side control, it should be nearly impossible to forge, remove or add transactions without the __user's consent__. The resulting ledger simply will not be consistent anymore.

  - The creation of Loreco's currency, __mani__, is strictly based on __trust__.
  Even though it is still possible to check the creation of mani cryptographically, trust has to be placed by the user in the __system ledger__ that this creation is done properly according to well established rules. This is extremly similar to how we assume, for example, cash or "money in our bank accounts" to be valid/trusted.

### Trust validation

Loreco uses trust-based logic extensibly, as it fits well with the socio-philosophical theory behind SuMSy.

The mot important concept to understand (for the centralized implementation), is that users can and should be able to __"defer"__ to a Loreco server of their choice that will maintain "their" ledger. Even though this is - at the moment - mostyly a theoretical choice, the idea of being able to switch is central to the idea that trust is given to the organisation that runs the Loreco service, it is not demanded (or even hard-coded).

Note that, at the moment, centralized Loreco servers are not interoperable.
So, they form their own __exclusionary monetary ecosystem__.
It is (theoretically) possible however to have two SuMSy systems interoperate.

### Using public keys as ID's

A ledger's ID is essentially the __hash of a public key__.
This is not such a strange notion, e.g. in Bitcoin an ID is equal to SECP 256K1 (ECC) public key. Since OpenPGP supplies a "fingerprint" for each (public) key, this is convenient to use.

The current implementation uses 4096 bit RSA public-private keys.

### Transactions

Basic Loreco transactions always come in __pairs__.
Both the __"sending"__ (SND) ledger and the __"receiving__ (RCV) ledger will contain the entire transaction in __mirror form__.
Note that this also implies that transactions can be initiated by either the sender ("push mode") __or__ the receiver ("pull mode"). It is simply a matter of changing the sign of the amount on both sides of the transaction.

Note that the ID of the corresponding ledger must be known by the initiating partner.
It is left to the client implementation to decide how to do that. For example, in this repository, through QR codes, URL links or something similar.
It is perfectly possible to have an ID pre-stored (remembered by the client) and in fact encouraged as the fingerprints are quite long alphanumeric codes.

An __alias__ (e.g. user's name) may be provided within the transactions, but it should __never__ be considered to hold any verifiable information and clearly be marked as "alias" in a client implementation.

A fully signed Loreco transaction always contains the following elements:

  - __ledger__: the ID of the owning ledger. This IDis a hash of the public key corresponging to that ledger, a 42-byte sequence provided by the OpenPGP library.

  - __destination__: the ID of the destination ledger that will receive the funds.

  - __date__: the datetime at which the transaction was initiated. Dates are stored in ISO 8601 Extended format.

  - __amount__: the amount to be transferred. 

    - This is stored in "mani" format, which is a string formatted like this:
      `1.235,65 ɱ` 
    or 
      `-1.235,65 ɱ` for negative amounts.

    - If the amount is negative, it means that mani is flowing from the __ledger__ to the __destination__.

    - mani is always rounded to the nearest 5 manicents.

    - mani is __not__ stored numerically as this can easily cause rounding errors and such. Instead, every operation on mani is done through [currency.js](https://currency.js.org/).


    - 'ɱ' is originally the symbol for the phonetic ["voiced labiodental nasal"](https://en.wikipedia.org/wiki/Voiced_labiodental_nasal).

  - __balance__: the current balance of the __ledger__, corresponding to the __amount__ added to the previous balance.

  - __sequence__: a positive integer representing the sequential number of this transaction on this ledger.

  - __uid__: the inherited __next__ property of the previous transaction on this ledger (see below).

  - __challenge__: this is a string representing the entire transaction in the form `/<ISO date>/from/<ledger id>/<ledger sequence>/<ledger uid>/to/<destination id>/<destination sequence>/<destination uid>/<amount>`.
  Sequence numbers are padded to 12 digits.
  The corresponding transaction on the destination ledger has a "flipped" version of the same challenge, where the amount changes sign and where the ledger and the destination are reversed.

  - __signature__: the cryptographic signature of the __challenge__, made with the private key of the (owning) __ledger__. This is stored as a (detached) armored OpenPGP signature.

  - __counterSignature__: Similar signature of the challenge, but made with the private key of the destination ledger.

  - __next__: The sha1 hash (40 bytes) of the __signature__, to be used for the uid of the next transaction.

### Transaction creation

A transaction always starts with the creation of a "challenge". A mani pona client can generate these as long as they know the current sequence number and "next" properties of both their own and the target ledger. In the centralized case, the server will provide these upon simple request.

Note that generating such a challenge does not imply a transaction was created. It is merely a __"proposal"__ for a new transaction. Also note that this assumes both sequence and uid variables are essentially __public__ information. Not much information can be derived, except how many transactions this ledger has already registered.

A client can then create a __new transaction__ by providing the server with the __challenge__, the __signature__ of the challenge, as well as the __counterSignature__ for the destination ledger, which is the cryptographic signature of the "flipped" version of the challgende. If all these match with the public key corresponding to the ledger as well as the correct sequence and uid's of the two ledgers involved, the transaction is stored as __"pending"__.

### Transaction confirmation

A __"destination"__ client should detect the pending transaction, e.g. by polling. They can then do a similar operation where they sign the "flipped" challenge for their ledger and __counter-sign__ the challenge for the ledger that started the transaction.

Once all four (counter)signatures are present on the two transactions, one on each ledger, the transaction is complete and becomes the __"current" state__ of the ledgers.

### System transactions

__System transactions__ like income/demurrage are always considered __"current"__ on the __system ledger__. The system ledger __never__ has __"pending"__ transactions, although the corresponding transaction on a user's ledger may be pending. As such, they are impossible to cancel and __have__ to be signed by the client.

### Initial transaction and oroborous signing

The initial transaction on a ledger always has sequence number `0`, uid `init` and an amount of `0,00 ɱ`.

The initial transaction on the system ledger is an __'oroborous' transaction__ that has the system ledger as both ledger and destination. This means that the signature and counter-signature are the same.

## Getting Started

### Installation

To run this application locally, you will need to have [nodejs/npm](https://nodejs.org/en/) installed on your system.

Clone this repository 
  `git clone git@github.com:LEFapps/mani-pona.git`

and then run
  `npm install`
  `npm install -g serverless`

### Running the application

#### Running DynamoDB

To start DynamoDB locally, run:
  `npm run test:dynamodb`

Note that DynamoDB will be running in memory, so when you stop DynamoDB __all data__ in it is automatically lost!

#### Running GraphQL

To start the GraphQL service, run:
  `sls offline`

#### Running the CLI tool

To install the CLI tool globally on your system, run
  `npm install -g`

After this step, you should be able to run the CLI `sumsy` on the command line if you have both a DynamoDB and the GraphQL server running locally.

### Running the test suite

### Running the frontend only

If you are only looking to make changes to the applications frontend, you might want to run the app locally using an active stack (backend, database).
To do this you will need up to date settings files.

Then from the root folder run
  `cd /client`
  `npm run web`

Webpack will open an instance of the application using Expo. You can access the application on
  `localhost:19006`

### Deploying changes

To compile the CLI and Lambda handler to distribution files, run:

  `npm run build`

#### Deploying frontend changes

If you want to deploy frontend changes that do not affect the back-end stack, the CLI, etc. run the following from the root folder:
  `cd /client`
  `npm run deploy:dev`

## Stack and Infrastructure

## Data structure

## File structure

## Functions