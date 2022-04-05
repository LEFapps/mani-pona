import Stripe from 'stripe'

import { strict as assert } from 'assert'
import { getLogger } from 'server-log'

const log = getLogger('core:stripe')

export default (ledgers, origin) => {
  const apiKey = process.env.STRIPE_PRIVATE_KEY
  if (!apiKey) throw new Error('STRIPE_PRIVATE_KEY env variable is missing')
  const stripe = new Stripe(apiKey)
  return {
    async startPayment (amount, ledger) {
      log.debug('Stripe ledger %j', ledger)
      console.log('Stripe ledger', ledger)
      const value = Number(amount)
      assert(value > 0.0, 'Only positive amounts can be processed.')
      assert(value > 0.5, 'Only amounts above € 0.50 can be processed.')
      const paymentIntent = await stripe.paymentIntents.create({
        amount: value * 100,
        currency: 'eur',
        description: 'Aankoop klavers LORECO',
        automatic_payment_methods: {
          enabled: true
        },
        // receipt_email: '',
        metadata: { ledger }
      })
      log.debug('Stripe response %j', paymentIntent)
      return paymentIntent.client_secret
    }
  }
}
