import Stripe from 'stripe'

import { strict as assert } from 'assert'
import { getLogger } from 'server-log'
import mani from '../../client/shared/mani'

const log = getLogger('core:stripe')

export default (ledgers, origin) => {
  const apiKey = process.env.STRIPE_PRIVATE_KEY
  if (!apiKey) throw new Error('STRIPE_PRIVATE_KEY env variable is missing')
  const stripe = new Stripe(apiKey)
  return {
    async startPayment (amount, ledger, core) {
      const transaction = core.mani(ledger)
      const quantity = Number(amount)
      assert(quantity > 0.0, 'Only positive amounts can be processed.')
      assert(quantity > 0.5, 'Only amounts above € 0.50 can be processed.')
      const session = await stripe.checkout.sessions.create({
        line_items: [{ quantity, price: 'price_1Kl8mRHWUsq4Q0ptNhX1PiaT' }],
        mode: 'payment',
        success_url: origin,
        cancel_url: origin,
        // customer_email: '',
        metadata: { ledger },
        locale: 'nl'
      })
      // challenging the system ledger is not possible, but pre-storing a reference to the payment should be helpful…
      // transaction.challenge('system', mani(amount))
      log.debug('Stripe:sessions.create response %j', session)
      return session.url
    },
    async confirmPayment (amount, ledger) {
      await transaction.putEntry({
        ledger,
        entry: 'notification',
        value: 'stripeSuccess'
      })
    }
  }
}
