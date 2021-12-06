import { createMollieClient } from '@mollie/api-client'
import { strict as assert } from 'assert'
import { getLogger } from 'server-log'

const log = getLogger('core:mollie')

export default (ctx, origin) => {
  log.info('ORIGIN (core): %s', origin)
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY env variable is missing')
  const mollieClient = createMollieClient({ apiKey })
  return {
    async startPayment (amount, ledger) {
      const value = parseFloat(amount)
      assert(value > 0.0, 'Only positive amounts can be processed.')
      log.info('PAYMENT Value: %s', amount)
      log.info('ORIGIN Value: %s', origin)
      mollieClient.payments
        .create({
          amount: {
            value: value.toFixed(2),
            currency: 'EUR'
          },
          locale: 'nl_BE',
          description: 'Aankoop Klavers LoREco',
          redirectUrl: origin,
          webhookUrl: 'https://yourwebshop.example.org/webhook'
        })
        .then(r => log.info('%j', r))
        .catch(r => log.error('%j', r))
      // return payment.getCheckoutUrl()
      return 'Some string'
    }
  }
}
