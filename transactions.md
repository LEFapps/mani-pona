
## This is the way.


Context:
  - payload:
      - ledger: String
      - destination: String
  - source:
      - ledger: shadow or current
      - destination: shadow or current
  - target:
      - ledger: pending or current
      - destination: pending or current

Initialize the first system transaction:


```js
 await Transactions(table).create(
  {
    ledger: 'system',
    destination: 'system'
  })
  .then((t) => t.addAmount(0))
```

Create the initial ledger challenge:

```js
 const challenge = await Transaction(table).create(
  {
    ledger: '<fingerprint>',
    destination: 'system'
  })
  .then((t) => t.addInit('source', '<fingerprint>'))
  .then((t) => t.addInit('target','system'))
  .challenge()
```

Sign a payload / challenge:

```js
 await Transaction(table).payload(payload)
  .then((t) => t.addSignature(ledger, signature))
  .then((t) => t.execute())
```

No payload

Provide ledger, destination
-> shadow or current are picked up
-> continuation
-> challenge or add amount
-> if add amount -> sign and save

Payload

Provide ledger/key, destination/key
make target:
-> for user: pending? or continue
-> for system: either system/key exists or it's still system/current
make source:
-> 
