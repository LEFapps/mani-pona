# Loreco

## Table of contents
- [About](#about)
- [Key terms](#key-terms)
  - [mani](#mani)
  - [GI](#gi)
  - [Demurrage](#demurrage)
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
  - [Serverless backend](#serverless-backend)
  - [Frontend](#frontend)
- [Functionality](#functionality)
  - [Account](#account)
  - [Ledger](#ledger)
  - [Transactions](#transactions)
  - [Admin](#admin)
  - [Various](#various)
- [Data structure](#data-structure)
  - [Ledgers and Transactions](#ledgers-and-transactions)
  - [Users](#users)
- [File structure](#file-structure)
  - [Client](#client)
    - [node_modules, .expo, web-build, sls-output.json, package-lock.json](#nodemodules-expo-web-build-sls-outputjson-package-lockjson)
    - [apollo](#apollo)
    - [config](#config)
    - [shared](#shared)
    - [App.js](#appjs)
    - [Client/src](#clientsrc)
      - [maniClient.js](#maniclientjs)
      - [authenticator.js](#authenticatorjs)
      - [assets](#assets)
      - [src/shared](#srcshared)
      - [src/helpers](#srchelpers)
      - [styles/global.js](#stylesglobaljs)
      - [routes, stacks and screens](#routes-stacks-and-screens)
  - [Src](#src)
    - [cognito](#cognito)
    - [core](#core)
      - [statemachine.js, system.js and transactions.js](#statemachinejs-systemjs-and-transactionsjs)
    - [dynamodb](#dynamodb)
    - [graphql](#graphql)
    - [lambda](#lambda)
    - [shared](#shared)
- [Stripe](#stripe)

## About

Loreco is an application supporting an alternative economic system. It allows users to maintain a ledger and carry out transactions using a digital currency (mani). The main features of Loreco are a __guaranteed basic income__, a system of __demurrage__, a unique __cryptographic__ system and user __security__ all outlined below.

The application also has a dashboard for administrators to aid the various processes.

___
## Key terms

### mani

The term for the currency used/created by the application. This currency can be renamed in the front-end but in this repository, as well as this documentation, will be referred to as `mani`.

### GI

Guaranteed income. GI is a concept related to the Universal Basic Income (UBI). The most commonly used scholarly definition today defines UBI as a periodic cash payment (1), unconditionally delivered (2) to all (3) on an individual basis (4), without means-test (5) or work requirement (6).
A guaranteed income differs from a UBI as the height of the amount must be sufficiently high to lead a minimally qualitative life, something which is not necessarily the case with a UBI. This means that the recipient must be able to cover all basic needs and be able to live a humane life.
A fixed amount of mani is created through a GI on all SuMSy accounts.

### Demurrage

Demurrage is expressed in percentages and is a (negative) interest charged on a financial account. The demurrage is calculated and subtracted from the account balance right before the GI is added to it. More precisely, demurrage is calculated on a weighted average of the account balance over time.
Note that demurrage effectively reduces the default income (= GI - demurrage) for accounts which hold large balances. This eliminates the ["Matthew effect"](https://en.wikipedia.org/wiki/Matthew_effect) common in financial stimulation measures.

___

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

The mot important concept to understand (for the centralized implementation), is that users can and should be able to __"defer"__ to a Loreco server of their choice that will maintain "their" ledger. Even though this is - at the moment - mostly a theoretical choice, the idea of being able to switch is central to the idea that trust is given to the organization that runs the Loreco service, it is not demanded (or even hard-coded).

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

  - __ledger__: the ID of the owning ledger. This IDis a hash of the public key corresponding to that ledger, a 42-byte sequence provided by the OpenPGP library.

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

___

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

___

## Stack and Infrastructure

### Serverless backend

The centralised version of SuMSy's Client API (this repository) is built on AWS (Amazon) Cloud infrastructure.

The backend uses the following:
- __DynamoDB__: the ledgers are stored on DynamoDB. DynamoDB is a key-value and document database.
- __AWS Lambda__: the SuMSy functionality (implementations of API calls) itself is implemented as an __AWS Lambda function__. this is a microservice which avoids having to run some kind of server.
- __GraphQL__: GraphQL is used as the communication protocol between Lambda and the database.
- __Cognito__: for identity management (registration and login of users), the application uses AWS Cogito.

The backend, and by extension the entire application, is fully __serverless__. Instead of having to run on a server (shared or not), it is composed entirely of services that operate "on demand", ensuring cost-effectiveness and responsiveness at any usage volume. The application scales automatically with the amount of users.

The centralized implementation of SuMSy output is a __CloudStack Formation__ that can be deployed more than once.

### Frontend

Loreco's frontend makes use of the [React Native framework](https://reactnative.dev/) in combination with [Expo](https://expo.io/). For the Authentication [AWS Amplify](https://docs.amplify.aws/) is used.

It uses [Apollo](https://www.apollographql.com/) for creating GraphQL queries.

___

## Functionality

The core functionality of this application:

### Account
- The user can register an account
- The user can log in
- The user can log out
- The user can log in across multiple devices using a public/private key combo that:
  - can be exported/imported as text
  - can be exported/imported as a QR code
- The system differentiates between different types of ledger (e.g. professional, private) and automatically uses the relevant parameters for these different types

### Ledger
- The user can initialize a ledger (this happens in the final step of the registration process, a user can not have an account without also having a ledger)
- The user can request that their ledger is blocked by an application admin
- The user can see the balance of their ledger
- The user can see predictions of their future balance, as it relates to demurrage and GI
- The user can add mani to their ledger using a different form of currency (e.g. euros) using Stripe
- The user can see ledger-related information, such as the timestamp of the latest change and the demurrage applicable to their ledger in percentage.
- The ledger can receive a GI if applicable
- The demurrage is automatically performed on a ledger at the correct time (see 'Key terms')


### Transactions
- The user can initialize a transaction and sign it using the QR code system
- The user can scan an initialized transaction and sign it using the QR code system
- The user can add a message to a transaction before signing it
- The user can see a history of all transactions on their ledger
- The user and admin can export a ledger's transaction history
- The user or an admin can cancel a pending transaction

### Admin
- The admin can view the system's parameters
- The admin can see relevant user information
- The admin can block a user's access to their ledger
- The admin can export a ledger's transaction history
- The admin can export all ledgers' transaction history
- The admin can export all relevant information of all the application's users
- The admin can initialize a prepaid account
- The admin can enable an account
- The admin can intervene in a user's pending transactions
- The admin can approve a request for a ledger's type
- The admin can assign a ledger's type
- The admin can change a ledger's balance

### Various
- The user can request help from an admin
- The user can view an FAQ page
- The user sees relevant notifications when using the application
- The user can see extra information on the use of the application through tooltips in relevant places
- A user can make use of a prepaid card system for transactions
- The user can use an in-app camera to scan QR-codes related to the application (transactions, accounts)
- The user can see the terms and conditions and the privacy statement before and after registering on the platform

___

## Data structure

### Ledgers and Transactions

When opening a new account a 'pk' entry is added to the dynamoDB.

Ledgers and transactions look similar in the DB since a ledger is initialized with an initial (self-signing) transaction.

Each ledger/transaction creates a new DynamoDB entry (optionally) containing the following:

```js
{
  ledger: '63ba03393ab27ad2e669bb5c65a39a7592bac305', // the ledger ID, which is also the user ID
  entry: '/2022-01-21T09:50:01.083Z/000000000001/89c26a0ad587f953bf3d2c6a24e97a06f29c5e67', // identifier of the transaction consisting of the creation-time timestamp, the sequence number of the transaction in the list of this ledger's total transactions, the ledger ID of the counter-party (either sender or receiver of this transaction)
  accountType: 'professional',
  alias: 'Jana Peeters',
  accountType: 'guaranteed_income', // Only present on pk records. This coincides with the parameters as defined by an admin and dictates the ledger's behaviour
  amount: '250,00 ɱ', // amount added or subtracted from this ledger when transaction is completed
  balance: '250,00 ɱ', // total balance of this ledger if/when transaction is completed
  challenge: '/2021-12-16T08:21:21.817Z/from/fe80c025f3b2c3b8781226dbb7fe5166cd14e3d9/000000000001/bfb09d77f9c86e89e51e4587838a3307c6b45ea6/to/system/000000000012/31456f20efdf9cd1412c207401c50e5c59a0dddc/250,00 ɱ', // challenge created by the system at the start of a transaction
  counterSignature: '-----BEGIN PGP SIGNATURE----- wnUEARYKAAYFAmG69wIAIQkQTf9UaMcZiE8WIQSF0dSxv83i9AAJIyJN/1Ro xxmITwuNAQDyUuuhv3Pahl6DJSwRHXDdFeh81ru0dsp6v8882ccwngD/eibw wzH3eSkL56jSowU4d1tjT+spOTfkKsrcBcDljQ8= =R/6H -----END PGP SIGNATURE-----',
  date: '2021-12-16T08:21:21.817Z',
  demurrage: '0,00 ɱ',
  destination: '2e88170751f20333c060dca863c68009ca36e371',
  income: '0,00 ɱ',
  message: 'Payment for bread.'
  next: 'e154f2e2ebeb141d49d8579aa2c5287226d50aa3',
  publicKey: '-----BEGIN PGP PUBLIC KEY BLOCK----- xjMEYbr2pxYJKwYBBAHaRw8BAQdABsk65j2e/ksQzwKS69fjp20WbvS1KtEe 0jG9/1YNcsDNAMKMBBAWCgAdBQJhuvanBAsJBwgDFQgKBBYAAgECGQECGwMC HgEAIQkQt/5RZs0U49kWIQT+gMAl87LDuHgSJtu3/lFmzRTj2Ui4AQCatZse rYF7RddCu2YkF+Pp1i21r25JtHnZWnukASF0zwD+IdfVlOr0Opj+exdJUjni HXFnwjsTql7E+V5O8Oh5UwfOOARhuvanEgorBgEEAZdVAQUBAQdAQNi15EA5 OkQIcOGhx9OqzsWqIbYpbv1xEu++jzoUPFUDAQgHwngEGBYIAAkFAmG69qcC GwwAIQkQt/5RZs0U49kWIQT+gMAl87LDuHgSJtu3/lFmzRTj2fnVAQCtPozO 1/hX3s7thCph7v0KbO/U5Yl0een6Et+9dcbSgAEA14BKvGWiHfgrusNBll9N 7vmSFkOgHyobVfj7PsfwfAI= =yuEg -----END PGP PUBLIC KEY BLOCK-----', // only on pk records
  remainder: '0',
  sequence: '1',
  signature: '-----BEGIN PGP SIGNATURE----- wnUEARYKAAYFAmG69xwAIQkQt/5RZs0U49kWIQT+gMAl87LDuHgSJtu3/lFm zRTj2XTkAQD8oDPq+RvhLhsNvZNlaKuYC/T7zV744og0LR6MdQkVxgEAxHXo wIqvt+8zJdx3SdZ6NwEU3dheFmNyiZUhq7PQBAQ= =qOYv -----END PGP SIGNATURE-----	',
  uid: 'bfb09d77f9c86e89e51e4587838a3307c6b45ea6'
}
```
### Users

Users are stored in a user pool on AWS Cognito belonging to a specific instance of the application. They consist of the default Cognito fields and a few Loreco-specific ones:

```js
{
  // From Cognito
  'Account Status': 'Enabled/CONFIRMED',
  'Last Modified': 'Jan 31, 2022 12:03:14 PM',
  'Created': 'Jan 21, 2022 9:32:11 AM',
  'sub': '	0c2573ef-f913-4c39-a662-b25eb43b706e',
  'address': 'Wolstraat 7',
  'email_verified': true,
  'email': 'janapeeters@gmail.com'
  // From Loreco
  'custom:alias': 'Jana Peeters',
  'custom:privacy': 1,
  'custom:ledger': 'fa5062a9b8a6b48a8f47346ae82b123ed08a1b5d', // this links a user to their ledger and its transactions in dynamoDB
  'custom:requestedType': 'default', // requests account type with application admin to be set on ledger
  'custom:city': 'Antwerpen',
  'custom:zip': '2000',
  'custom:phone': '0456111111',
  'custom:birthday': '06/08/1990'
}
```

Note that the user's keys are saved at the ledger level, not in Cognito.

___

## File structure

The project is roughly divided in three types:
- Frontend
- Backend
- Config

Frontend files are all contained in the __'client'__ folder.

Backend files are contained in __'src'__ folder. 

Root level config files dictate the project's settings (.env, .envrc, babel.config.js, jest.config etc.), functions (package.js, ) secrets (.manipona.jeys.json), and other various necessary files (serverless.yml, this README, etc.).
Other config files are saved in the other folders.

The most important files are listed and explained below.

### Client

#### node_modules, .expo, web-build, sls-output.json, package-lock.json

These files/folders should (probably) never need to change as they are automatically generated by different processes (installation and deployment).

#### config

The client folder has its own set of config files it needs to function properly.
- aws-config.js is used to set up Amplify, graphQL interaction, and S3 storage.
It sources its variables from sls-output.json, created by deploying a (new) stack of the client code. !important: you should avoid hardcoding any of these variables for obvious security reasons.
- .env can be used to store global environment variables as needed. For most instances of Loreco, the following should suffice:
  `SKIP_PREFLIGHT_CHECK=true`
- app.json provides settings for expo and is needed if you intend to build Loreco for mobile devices.
- babel.config.js makes sure your application will run as intended through expo.
- deploy.js is called when deploying the frontend stack to CloudFront and calls other useful functions for deployment.

#### apollo

The frontend creates its own Apollo Client (`client/apollo/client.js`). The different queries used are stored in a single file: `client/apollo/queries.js`.

#### shared

Shared contains files with tools used in multiple functions and components.

- colums.json lists all possible data-fields for display
- crypto.js contains functions related to cryptographic data and processes like hashing and key-generating.
- mani.js contains functions that can be performed on the application's currency. It creates the Mani class, containing all necessary operations for this data.
- tools.js is an important file for the frontend. It contains frequently used functions for just about every frontend feature. We recommend being extra careful when making changes to these functions as they are central to both the user experience as well as the ledger system.

#### App.js

For all intents and purposes, this is the starting point for Loreco's frontend.

It has all the functionality one would expect from a modern React Native (or even React) project.

It initializes necessary processes such as AWS Amplify, the custom notification-system and Apollo.

It checks if a user is logged in and/or authorized, and reroutes them to the correct component view accordingly.

More on these specific functions below, under [Functions](#functions)

#### Client/src

The /client/src folder holds all Components for Loreco's frontend as well as some other helpers and assets.

The routing logic is housed in /routing for easy access, editing and overview.

##### maniClient.js

maniClient.js is the beating heart of the Loreco application's frontend. It is, therefore, strongly recommended to not change anything inside the file or perform expansive testing if changes had to be made. More on the functions within this file below.

##### authenticator.js

Authenticator checks if a user is logged in and shows correct components upon validation of user type and status.

##### assets

Assets contains application specific and reused/reusable assets such as icons and logos.

##### src/shared

`src/shared` contains reusable small components for frontend views. These should __only__ contain components that are used multiple times and in multiple views.

##### src/helpers

`src/helpers` contains various frontend functions reusable across all other components/views.

##### styles/global.js

Loreco uses React Native's default styling method of Stylesheets. The different styles are defined in this file. Read up on React Native's styling method [here](https://reactnative.dev/docs/style) if needed.

##### routes, stacks and screens

Loreco uses [React Native's Stack system](https://reactnavigation.org/docs/stack-navigator/) for all of its views. `stacks/main.js` is the router for the stacks defined in the subfolder `routes/stacks`.

Each defined stack has/can have its own defined styling and behavior and refers to shared components and its own unique screen from the /screens folder.

### Src

#### cognito

The `src/cognito` folder contains helper functions and logic related to AWS Cognito registration, login and authentication.

The `userpool.js` file has functions setting up a new userpool on AWS Cognito (if one is not already present), as well as custom functionality.
#### core

The `src/core` folder initializes server (backend) functionality for Loreco.

It initializes the 'Ledgers' dynamoDB table in `ledgers.js`.

`util.js` contains frequently used functions for server-side functionality.

`verification.js`, as its naming suggests, has verification functions for entries.

`stripe.js` connects to the Stripe API, for users to purchase mani with their local official currency.

##### statemachine.js, system.js and transactions.js

These files do most of the heavy lifting for the Loreco application.
LEF recommends you do not make any changes to these, especially the statemachine, unless absolutely necessary, since they contain the core logic of the SuMSy systems.

The __statemachine__ is used for all possible actions and transactions with mani, and ensures this happens securely and in the correct order.

__transactions__ both creates QR-codes holding a transactions challenge, as the confirmation/signing of a challenge.

__system__ has various serverside functions, including but not limited to the creating of prepaid ledgers, sending challenges to the statemachine, system payments and exports of transaction- and user-data.
#### dynamodb

The dynamoDB folder has files setting up the ledger data to be saved, changed and fetched form the database.
#### graphql

This folder holds the type definitions and resolvers needed to use GraphQL to interact with DynamoDB. All these files follow the recommended design philosophies of GraphQL, read up on it [here](https://graphql.org/learn/) if needed.

#### lambda

GraphQL handlers are created here, as well as some useful logs when running the application through AWS Lambda. Stripe's handler also originates here.

#### shared

The `shared.js` files imports some useful frontend functions for server-side use.

___
## Stripe
### Setup

#### 1 Create an API Key

Populate the following fields:

```YML
STRIPE_PUBLIC_KEY=pk_123ABC # Publishable key
STRIPE_PRIVATE_KEY=sk_123ABC # Secret key
```

You can find the API keys in your Stripe dashboard under _Developers › API keys_

#### 2 Create a webhook

In your Stripe Developers dashboard, select _Webhooks_. Create a new webhook with the following details:

```YML
Endpoint URL: {{HttpApiUrl}}/{{stage}}/stripe
Description: Capture payments for Loreco ({{stage}})
```

And select the following events to listen to: `[√] Select all Checkout events`.

After creating the webhook, add the _Signing Secret_ to the .env file:

```YML
STRIPE_WEBHOOK_SECRET=whsec_123ABC # webhook signing secret
```

#### 3 Create a product

Go to _Products_ in your Stripe dashboard and click on _+ Add product_. Fill in the following details:

```YML
Name: Klaver
Image: <logo>
Description: explain the exchange rate (e.g. 1 Klaver = € 1)
Pricing: standard pricing, one time
Price: fill the price for 1 klaver, e.g. € 1
```

After saving, click on the product in the list to see the details. Copy the _Pricing API ID_ (e.g. price_123ABC) and fill this in your .env file:

```YML
STRIPE_PRICE_ID=price_123ABC # pricing API ID
```

#### 4 Deploy the app

After deployment, the endpoint should be able to catch Stripe calls from the checkout page.


