
[Technical documentation](usage.md)

To install, first clone this repository locally, then run
```
npm install
npm install -g serverless
```
(You will need to have [nodejs/npm](https://nodejs.org/en/) installed on your system to do this.)

To start DynamoDB locally, run:
```
npm run test:dynamodb
```
Note that DynamoDB will be running in memory, so when you stop DynamoDB, *all data* in is automatically lost!

To start the Graphql service, run:
```
sls offline
```

To install the CLI tool globally on your system, run
```
npm install -g
```
after this step, you should be able to run the experimental CLI `sumsy` on the command line if you have both a DynamoDB and the graphql server running locally.

To run the test suite:
```
npm run test
```

# mani pona - a centralized SuMSy implementation

"mani pona" (always written in lower case) is an implementation of the "Sustainable Money System". This repository contains a centralized implementation, although the ledgers are designed with a potential decentralized implementation and migration in mind.

mani pona is _not_ a blockchain-based currency. Although it uses cryptographic functions to ensure data integrity, its ledger design is completey different from the blockchain approach. The core concepts to understand this project are "forward signing" and "trust validation". So, an appropriate term would be 'forward signing ledger'.

### Forward signing
 
mani pona uses an individual ledger per user (even if they may use the same database in the centralized implementation). These ledgers are sequential series of (monetary) transactions. However, every transaction ("line" in the ledger) contains a (double-)signed reference to the previous transaction in the same ledger. This makes it impossible to remove or alter historical transactions in a ledger without destroying its internal consistency. Since the cryptographic signatures are based on a hash of the signature(s) as well as the sequence number of the previous transaction(s), plus date and amount, the ledger becomes an "unbreakable chain".

To sign transactions, mani pona uses public/private key signing, where the user is in *full control* of their own private key. This implies a few things:
- Loss of this private key functionally eliminates a ledger. It is impossible to create an internally consistent transaction on a ledger without the private+public keys.
- Even with full server-side control, it should be nearly impossible to forge, remove or add transactions without the user's consent. The resulting ledger simply will not be consistent anymore.
- The creation of *mani* is strictly based on trust. Even though it is still possible to check the creation of mani cryptographically, trust has to be placed by the user in the 'system ledger' that this creation is done properly, according to well established rules. This is extremely similar to how we assume e.g. cash or 'money in our bank accounts' to be valid (trusted).

### Trust validation
 
mani pona uses trust-based logic extensibly, as it fits well with the socio-philosophical theory behind SuMSy. The most important concept to understand (for the centralized implementation), is that users can and should be able to "defer" to a mani pona server of their choice that will maintain "their" ledger. Even though this is - at the moment - mostly a theoretical choice, the idea of being to switch is central to the idea that trust is given to the organisation that runs the mani pona service, it is not demanded (or hard-coded).

Note that, at the moment, centralized mani pona servers are not interoperable. So, they form their own exclusionary monetary ecosystem. It is (theoretically) possible however to have two SuMSy system interoperate.

### Using public keys as ID's

A ledger's ID is essentially the hash of a public key. This is not such a strange notion, e.g. in Bitcoin, an ID is equal to a SECP 256K1 (ECC) public key. Since OpenPGP supplies a "fingerprint" for each (public) key, this is convenient to use. The current implementation uses 4096 bit RSA public-private keys.

## Transactions

Basic mani pona transactions always come in pairs. Both the "sending" (SND) ledger and the "receiving" (RCV) ledger will contain the entire transaction in "mirror form". Note that this also implies that transactions can be iniated by either the sender ("push mode") _or_ the receiver ("pull mode"). It is simply a matter of changing the sign of the amount on both sides of the transaction.

Note that the ID of the corresponding ledger must be known by the initiating partner. It is left to the client implementation to decide how to do that, e.g.
through QR codes, URL links or something similar. It is perfectly possible to have an ID pre-stored (remembered by the client) and in fact encouraged as the fingerprints are quite long alphanumeric codes.

An alias (e.g. user's name)  may be provided within the transactions, but it should *never* be considered to hold any verifiable information and clearly be
marked as "alias" in a client implementation.

A fully signed mani pona transaction mani pona transaction always contains the following elements:
- **ledger**: The ID of the (owning) ledger. This ID is a hash of the public key corresponding to that ledger, a 42-byte sequence provide by the OpenPGP library.
- **destination** The ID of the 'destination' ledger that will receive the funds.
- **date**: The datetime at which the transaction was initiated. Dates are stored in ISO 8601 Extended format.
- **amount**: The amount to be transferred. This is stored in "mani" format, which is a string formatted like this: "1.235,65 ɱ" or "-1.235,65 ɱ" for negative amounts. mani is always rounded to the nearest 5 manicents. mani is *not* stored numerically as this can easily cause rounding errors and such. Instead, every operation on mani is done through [currency.js](https://currency.js.org/). "ɱ" is originally the symbol for the phonetic ["voiced labiodental nasal"](https://en.wikipedia.org/wiki/Voiced_labiodental_nasal). If the amount is negative, it means that mani is flowing from the **ledger** to the **destination**.
- **balance**: The current balance of the **ledger**, correpsonding to the **amount** added to the previous balance.
- **sequence**: A positive integer representing the sequential number of this transaction on this ledger.
- **uid**: The (inherited) **next** property of the previous transaction on this ledger. (See below.)
- **challenge**: This is a string representing the entire transaction in the form `/<ISO date>/from/<ledger id>/<ledger sequence>/<ledger uid>/to/<destination id>/<destination sequence>/<destination uid>/<amount>`. Sequence numbers are padded to 12 digits. The corresponding transaction on the destination ledger has a "flipped" version of the same challenge, where the amount changes sign and ledger and destination are reversed.
- **signature**: The cryptographic signature of the **challenge**, made with the private key of the (owning) **ledger**. This is stored as a (detached) armored OpenPGP signature.
- **counterSignature**: Similare signature of the challenge, but made with the private key of the destination ledger.
- **next**: The sha1 hash (40 bytes) of the **signature**, to be used for the uid of next transaction.

### Transaction creation
A transaction always starts with the creation of a "challenge". A mani pona client can generate these as long as they know the current sequence number and "next"properties of both their own and the target ledger. In the centralized case, the server will provide these upon simple request.

Note that generating such a challenge does not imply a transaction was created. It is merely a "proposal" for a new transaction. Also note that this assumes both sequence and uid variables are essentially *public* information. Not much information can be derived, except how many transactions this ledger has already registered.

A client can then create a new transaction by providing the server with the challenge, as well as the signature of the challenge, as well as the "counterSignature" for the destination ledger, which is the cryptographic signature of the "flipped" version of the challenge. If all these match with the public key corresponding to the ledger as well as the correct sequence and uid's of the two ledgers involved, the transaction is stored as "pending".

### Transaction confirmation
A "destination" client should detect the pending transaction, e.g. by polling. They can then do a similar operation where they sign the "flipped" challenge for their ledger and counter-sign the challenge for the ledger that started the transaction.

Once all four (counter)signatures are present on the two transactions, one on each ledger, the transaction is complete and becomes the "current" state of the ledgers.

### System transactions
System transactions like income/demurrage are always considered "current" on the system ledger. The system ledger never has "pending" transactions, although the corresponding transaction on a user's ledger may be pending. As such, they are impossible to cancel and *have* to be signed by the client.

### Initial transaction & oroborous signing
The initial transaction on a ledger always has sequence number `0`, uid `init` and an amount of `0,00 ɱ`. The initial transaction on the system ledger is an 'oroborous' transaction that has the system ledger as both ledger and destination. This means that the signature and counter-signature are the same.


