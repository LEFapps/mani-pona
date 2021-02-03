
## This is the way.


Initialize the first system transaction:


```js
 await Transaction(table).create()
  .then((t) => t.addInit('source','system'))
  .then((t) => t.addInit('target', 'system'))
  .then((t) => t.addAmount(0))
  .then((t) => t.execute())
```

Create the initial ledger challenge:

```js
 const challenge = await Transaction(table).create()
  .then((t) => t.addInit('source', '<fingerprint>'))
  .then((t) => t.addInit('target','system'))
  .then((t) => t.addAmount(0))
  .challenge()
```

Sign a payload / challenge:

```js
 await Transaction(table).payload(payload)
  .then((t) => t.addSignature(ledger, signature))
  .then((t) => t.execute())
```


