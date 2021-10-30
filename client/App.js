import React, { useState } from 'react'
import { View } from 'react-native'
import { Authenticator } from 'aws-amplify-react-native'
import { Amplify, Analytics } from 'aws-amplify'
import log from 'loglevel'

import SignIn from './src/screens/auth/signIn'
import SignUp from './src/screens/auth/signUp'
import ConfirmSignUp from './src/screens/auth/confirmSignUp'
import VerifyContact from './src/screens/auth/verifyContact'
import maniClient from './src/maniClient'
import Loreco from './src/authenticator'
import graphqlClient from './apollo/client'
import { globalStyles } from './src/styles/global'

import config from './aws-config'

import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import './src/helpers/i18n'
import { NotificationProvider } from './src/shared/notifications'

Amplify.configure(config)
Analytics.configure({ disabled: true })

log.enableAll()

export const resetClient = async (options = {}) => {
  try {
    const mc = await maniClient({ graphqlClient, ...options })
    global.maniClient = mc
    // console.log('client/reset', mc.id)
    return mc
  } catch (error) {
    console.error('client/reset', error)
  }
}

const App = () => {
  const [state, setState] = useState()

  const Container = ({ children }) => (
    <View style={globalStyles.container}>{children}</View>
  )

  return (
    <NotificationProvider>
      <Authenticator container={Container} hideDefault onStateChange={setState}>
        <SignIn override={'SignIn'} />
        <SignUp override={'SignUp'} />
        <ConfirmSignUp override={'confirmSignUp'} />
        <VerifyContact override={'verifyContact'} />
        <Loreco />
      </Authenticator>
    </NotificationProvider>
  )
}

export default App
