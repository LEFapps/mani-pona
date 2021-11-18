import { createMollieClient } from '@mollie/api-client'
import assert from 'assert/strict'

export default (ledgers, origin) => {
  const apiKey = process.env.MOLLIE_API_KEY
  if (!apiKey) throw new Error('MOLLIE_API_KEY env variable is missing')
  const mollieClient = createMollieClient({ apiKey })
  return {
    async startPayment (amount, ledger) {
      const value = amount.value()
      assert(value > 0.0, 'Only positive amounts can be processed.')
      const payment = await mollieClient.payments.create({
        amount: {
          value: value.toFixed(2),
          currency: 'EUR'
        },
        description: 'Aankoop munten',
        redirectUrl: `${origin}/mollie`,
        webhookUrl: 'https://yourwebshop.example.org/webhook'
      })
      return payment.getCheckoutUrl()
    }
  }
}
