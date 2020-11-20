
:warning: **This API is under development. Any and all aspects are subject to change.**

# Using the mani pona client

## Installation

Make sure this package sits in your `node_modules` folder.

@TODO: Installation via npm.

## Import and start the client

```js
const { ManiClient } = require('mani-pona').client

const maniClient = new ManiClient({credentials,endpoint})

const notifications = maniClient.notifications
    .all()
    .then(notifications => {
      // notifications is an array of messages, like the application of demurrage or a new income payment
    })
```

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

## Making payments (version 2)

This changes which peer enters the amount:

```js
maniClient.create({
  peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C226'
})
  .then(notification => {
    // notifcation
  })
  .catch(error => {
    // e.g. time-outs, etc
  })
```
