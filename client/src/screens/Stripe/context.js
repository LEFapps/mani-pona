import React, { createContext } from 'react'
import { loadStripe } from '@stripe/stripe-js'

import { StripeKey } from '../../../sls-output.json'

const stripePromise = loadStripe(StripeKey)
export const StripeContext = createContext(stripePromise)

export default ({ children }) => (
  <StripeContext.Provider value={stripePromise}>
    {children}
  </StripeContext.Provider>
)
