import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Authenticator, VerifyContact } from 'aws-amplify-react-native'
import { Auth } from 'aws-amplify'

import SignIn from '../src/screens/auth/signIn'
import SignUp from '../src/screens/auth/signUp'
import ConfirmSignUp from '../src/screens/auth/confirmSignUp'
import KeyPrompt from '../src/screens/auth/keyPrompt'
import Navigation from '../src/routes/main'
import { resetClient } from '../App'
import { KeyManager } from './helpers/keymanager'
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
      onStateChange('verifyContact', { storageKey, keyValue, email })

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

const styles = {
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#2B8AA0'
  }
}
