import { getLogger } from 'server-log'
import stripe from 'stripe'
import mani from '../../client/shared/mani'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const log = getLogger('lambda:stripe')

export default ({ core }) => (request, context, callback) => {
  let event
  const signature =
    request.headers['stripe-signature'] || request.headers['Stripe-Signature']

  const response = {
    statusCode: 200,
    headers: {}
  }

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      signature,
      endpointSecret
    )
  } catch (err) {
    response.statusCode = 400
    response.body = `SuMSy Stripe Webhook Error: ${err.message}`
    console.error('Stripe constructEvent Error:', err.message)
    log.error('Stripe constructEvent Error \n%s', err.message)
    return response
  }

  console.log('Handling event type:', event.type)
  log.debug('Handling event type %s', event.type)

  const data = event.data.object
  // console.log('Event data: ', data)
  // log.debug('Event data: %j', data)

  // Handle the event
  const { amount_total, payment_status, metadata } = data
  const amount = mani(amount_total / 100)
  const { ledger } = metadata
  switch (event.type) {
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
    case 'charge.succeeded':
      // Then define and call a function to handle the event charge.succeeded
      console.log('no further action needed, except notification')
      log.info('no further action needed, except notification')
      break
    case 'checkout.session.completed':
      console.log('Applying payment to ledger')
      log.info('Applying payment to ledger')
      if (payment_status === 'paid')
        core.system().forceSystemPayment(ledger, amount, 'Aankoop klavers')
      break
    case 'checkout.session.async_payment_succeeded':
      console.log('Applying payment to ledger')
      log.info('Applying payment to ledger')
      core.system().forceSystemPayment(ledger, amount, 'Aankoop klavers')
      break
    // ... handle other event types
    default:
      console.log('Unhandled event type:', event.type)
      log.debug('Unhandled event type %s', event.type)
  }

  console.log('Responding with:', response)
  log.debug('Responding with %j', response)

  return response
}
