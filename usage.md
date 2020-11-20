
:warning: **This API is under development. Any and all aspects are subject to change.**

# Using the mani pona client

## Installation

Make sure this package sits in your `node_modules` folder.

@TODO: Installation via npm.

## Import and start the client

```js
const { ManiClient } = require('mani-pona')

const maniClient = new ManiClient({credentials,endpoint})

// Immediately after startup, any (new) notifications should be checked
const notifications = maniClient.notifications
    .all()
    .then(notifications => {
      // notifications is an array of messages, like the application of demurrage or a new income payment
    })
```

### Using the mock client

Instead of using the "real" client, you can use the MockClient during development.

While you don't need to pass credentials into the Mock Client, it is possible to pass arguments in the constructor to _intentionally_ make the Mock Client fail certain operations. This is helpful when developing error handling.

The MockClient will behave as predictably as possible, so its internal state (e.g. balance, list of transactions) will *not* change. All methods should "work" no matter what, except when crucial parameters are missing (and other incorrect usages of the API).

```js
const { MockClient } = require('mani-pona')

const maniClient = new MockClient({
  fail: "timeout|unknown_id" // optional, this makes the MockClient fail predictably
})
```

Fail options:
- `timeout`: This makes transactions (creation or listening mode) fail due to a "timeout".
- `unknown_id`: This makes creating transactions fail due to an "unknown peer id".

## Making payments (version 1)

(If the amount is known in the first stage.)

One peer has to "open" the transaction:

```js
let peerId = maniClient.peerId
// pass this peerId on to the other party, e.g. through a QR code
// then put the client in listening mode
maniClient1.transactions
  .listen()
  .then(confirmation => {
    // confirm the payment using the callback provided in the confirmation
  })
  .catch(error => {
    // e.g. time-outs, cancels, etc
  })
```

The other peer can then start the payment process, with the desired amount:

```js
maniClient2.transactions
  .create({
    amount: 10.0, // if the objective is to send money, simply provide a negative number here
    peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C226',
    msg: 'Message to add to the transaction'
  })
  .then(notification => {
    // notification of success
  })
  .catch(error => {
    // e.g. time-outs, declined, etc
  })
```

