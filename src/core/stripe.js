import assert from 'assert/strict'
import Stripe from 'stripe'
import { getLogger } from 'server-log'

const log = getLogger('core:stripe')

export default (ledgers, origin) => {
  const apiKey = process.env.STRIPE_PUBLIC_KEY
  if (!apiKey) throw new Error('STRIPE_PUBLIC_KEY env variable is missing')
  const stripe = new Stripe(apiKey)
  return {
    async startPayment (amount, ledger) {
      const value = amount.value()
      assert(value > 0.0, 'Only positive amounts can be processed.')
      const paymentIntent = await stripe.paymentIntents.create({
        amount: value.toFixed(2),
        currency: 'eur',
        description: 'Aankoop klavers LORECO',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: { ledger }
      })
      log.debug('Stripe response %j', paymentIntent)
      return paymentIntent.client_secret
    }
  }
}
