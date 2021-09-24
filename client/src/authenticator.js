import React, { useState, useEffect, Fragment } from 'react'
import { Text, TextInput, View, Dimensions, LogBox, Modal } from 'react-native'
import { Authenticator, VerifyContact } from 'aws-amplify-react-native'
import { Amplify, Analytics, Auth } from 'aws-amplify'
import log from 'loglevel'

import SignIn from '../src/screens/auth/signIn'
import SignUp from '../src/screens/auth/signUp'
import ConfirmSignUp from '../src/screens/auth/confirmSignUp'
import KeyPrompt from '../src/screens/auth/keyPrompt'
import Navigation from '../src/routes/main'
import CustomButton from './shared/buttons/button'

import config from '../aws-config'
import { globalStyles } from './styles/global'
import { resetClient } from '../App'

export default () => {
  const { maniClient } = global

  // Keys present?
  const [isNew, setNew] = useState(!maniClient.id)
  const [hasKeys, setKeys] = useState(maniClient.id)
  console.log('hasKeys', hasKeys)

  if (!hasKeys)
    return (
      <KeyPrompt
        onResolve={keys => {
          if (keys === 'pasted') setNew(false)
          setKeys(keys)
        }}
      />
    )
  return (
    <Authenticator
      container={({ children }) => {
        return <View style={styles.container}>{children}</View>
      }}
      hideDefault
      authState={isNew ? 'signUp' : 'signIn'}
      onStateChange={authState => {
        console.log('authState', authState)
        if (['signIn', 'signUp'].includes(authState))
          setKeys(global.maniClient.id)
        if (authState === 'verifyContact') return 'signedIn'
        return authState
      }}
    >
      <Navigation />
      <SignIn override={'SignIn'} />
      <SignUp override={'SignUp'} />
      <ConfirmSignUp override={'confirmSignUp'} />
      <VerifyContact />
    </Authenticator>
  )
}

const styles = {
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#2B8AA0'
  }
}
