import React, { useEffect, useState } from 'react'

import Navigation from '../src/routes/main'
import { resetClient } from '../App'
import { keyWarehouse } from './maniClient'

export const UserContext = React.createContext(false)

export default ({ authState, authData: user, onStateChange, keyValue }) => {
  const { maniClient } = global
  const [isReady, setReady] = useState()

  useEffect(() => {
    initClient()
  }, [user, maniClient, authState])

  const initClient = async () => {
    if (!user || authState !== 'signedIn') return
    const { 'custom:ledger': ledgerId, email } = user.attributes
    const storageKey = (
      (await keyWarehouse.list()).find(({ username }) => username === email) ||
      {}
    ).key
    if (!ledgerId)
      onStateChange('verifyContact', { storageKey, keyValue, email, ...user })

    await resetClient({ storageKey })
    setReady(true)
  }

  return (
    <UserContext.Provider value={user}>
      {authState === 'signedIn' && !!user && !!maniClient && !!isReady ? (
        <Navigation />
      ) : null}
    </UserContext.Provider>
  )
}
