
[Technical documentation](usage.md)

# mani pona - a centralized SuMSy implementation

"mani pona" (always written in lower case) is an implementation of the "Sustainable Money System". This repository contains a centralized implementation, although the ledgers are designed with a potential decentralized implementation and migration in mind.

mani pona is _not_ a blockchain-based currency. Although it uses cryptographic functions to ensure data integrity, its ledger design is completey different from the blockchain approach. The core concepts to understand this project are "forward signing" and "trust validation".

### Forward signing

mani pona uses an individual ledger per user (even if they may use the same database in the centralized implementation). These ledgers are sequential series of (monetary) transactions. However, every transaction ("line" in the ledger) contains a (double-)signed reference to the previous transaction in the same ledger. This makes it impossible to remove or alter historical transactions in a ledger without destroying its internal consistency. Since the cryptographic signatures are based on a cryptographic hash of the previous transaction, the ledger becomes an "unbreakable chain".

To sign transactions, mani pona uses public/private key signing, where the user is in full control of their own private key. This implies a few things:
- Loss of this private key functionally eliminates a ledger.
- Even with full server-side control, it should be nearly impossible to forge, remove or add transactions without the user's consent. The resulting ledger simply will not be consistent anymore.

### Trust validation

mani pona uses trust-based logic extensibly, as it fits well with the socio-philosophical theory behind SuMSy. The most important concept to understand (for the centralized implementation), is that users can and should be able to "defer" to a mani pona server of their choice that will maintain "their" ledger. Even though this is - at the moment - mostly a theoretical choice, the idea of being to switch is central to the idea that trust is given to the organisation that runs the mani pona service, it is not demanded (or hard-coded).

Note that, at the moment, centralized mani pona servers are not interoperable. So, they form their own exclusionary monetary ecosystem. It is (theoretically) possible however to have two SuMSy system interoperate.

### Using public keys as ID's

A ledger's ID is essentially the hash of a public key. This is not such a strange notion, e.g. in Bitcoin, an ID is equal to a SECP 256K1 (ECC) public key. Since OpenPGP supplies a "fingerprint" for each (public) key, this is convenient to use.

## Transactions

Basic mani pona transactions always come in pairs. Both the "sending" (SND) ledger and
the "receiving" (RCV) ledger will contain the entire transaction in "mirror
form". Note that this also implies that transactions can be iniated by either
the sender ("push mode") _or_ the receiver ("pull mode").

Note that the ID of the corresponding ledger must be known by the initiating
partner. It is left to the client implementation to decide how to do that, e.g.
through QR codes, URL links or something similar. It is perfectly possible to 
have an ID pre-stored (remembered by the client).

An alias (e.g. user's name)  may be provided within the transactions, but it
should *never* be considered to hold any verifiable information and clearly be
marked as "alias" in a client implementation.

A fully signed mani pona transaction mani pona transaction contains the
following elements:
- The datetime at which the transaction was initiated. A Unix timestamp is used
  for this purpose.
- The ID of the ledger that will receive the funds. This ID is a hash
  of the public key corresponding to that ledger.
- The ID of the sending ledger.
- The amount to be transferred.
- The cryptographic algoritms used for for public/private key signing and the
  hashing algoritm used to generate the ledger ID. When unsupported algoritms
  are declared, this should result in errors.

### Sender initiated transaction, including amount

Abbreviations used:
- PK<sub>S|R</sub> : public key of either sender or receiver
- ID<sub>S|R</sub> : identifier of either sender or receiver, which is equal to hash(PK<sub>S|R</sub>)
- c<sub>S|R,t</sub> : chain signature at time t, which is also a transaction's ID
- p<sub>S|R,t</sub>: proof signature at time t

#### Step 1: Initial packaging by sender

The initial payload (sender initiated, value known) of a transaction at time T, with a mani amount M consists of:
- PK<sub>S</sub> : public key of sender
- c<sub>S,T-1</sub> : chain signature of previous transaction on sender's ledger
- T : time of new transaction
- M : amount of mani to be transferred
- c<sub>S,T</sub> = sign<sub>S</sub>(c<sub>S,T-1</sub>,ID<sub>R</sub>,-M,T) : proposed new chain signature aka "I will enter this transaction in my ledger under this identifier"
- Which public/private signing algorithm is to be used.

#### Step 2: Verification and countersigning by receiver

1. Verify signature c<sub>S,T</sub> with PK<sub>S</sub>.
2. Return to sender:
  - PK<sub>R</sub>
  - c<sub>R,T-1</sub>
  - c<sub>R,T</sub> = sign<sub>R</sub>(c<sub>R,T-1</sub>,ID<sub>S</sub>,M,T) : proposed next chain code
  - p<sub>R,T</sub> = sign<sub>R</sub>(c<sub>S,T</sub>,ID<sub>S</sub>,M,T) : proof signature for sender aka "Here is proof that I agreed to the transaction, I accept this payment."


#### Step 3: Verification and countersigning by sender

1. Verify signatures c<sub>R,T-1</sub> and p<sub>R,T</sub> with PK<sub>R</sub>.
2. (At this point the transaction can be recorded by the sender.)
3. Return to receiver:
   - p<sub>S,T</sub> = sign<sub>S</sub>(c<sub>R,T</sub>,ID<sub>R</sub>,-M,T) : proof signature for receiver, "I acknowledge the transfer."

#### Step 4: Verification by receiver

1. Verify p<sub>S,T</sub> with PK<sub>S</sub>
2. (At this point the transaction can be recorded by the receiver.)

#### Added lines to ledgers after completed transaction

For the sender:
- transaction "id" (chain code): c<sub>S,T</sub>
- time : T
- amount: -M
- other party: ID<sub>R</sub>
- proof: p<sub>R,T</sub>

For the receiver:
- transaction "id" (chain code): c<sub>R,T</sub>
- time : T
- amount: M
- other party: ID<sub>S</sub>
- proof: p<sub>S,T</sub>

### Notes on cryptographic setup

- Since the ID is a hash of a public key, care should be given not to accept the
  ID itself as proof-of-ownership, or even the underlying public key. Only a
  signing operation with the private key can truly provide proof-of-ownership.
  Note that this implies that the security of the hash used for the ID is far
  less important. While a hash collision may be possible, it will be much harder
  to find a collision resulting in a valid public key and pretty much impossible
  to also do this with a corresponding private key.
- While mani pona theoretically supports multiple cryptographic implementations,
  it will initially only support one set.
- When considering the hashing algoritm, care should be given to the byte size
  of the resulting ID as it can - theoretically - also be used as the ID for a
  decentralized (DHT) implementation.

