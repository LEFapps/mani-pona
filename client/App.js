import React, { useState, useEffect } from 'react'
import { Text, TextInput, View, Dimensions, LogBox } from 'react-native'
import { Authenticator } from 'aws-amplify-react-native'
import { Amplify, Analytics } from 'aws-amplify'
import log from 'loglevel'

import SignIn from './src/screens/auth/signIn'
import SignUp from './src/screens/auth/signUp'
import ConfirmSignUp from './src/screens/auth/confirmSignUp'
import VerifyContact from './src/screens/auth/verifyContact'
import Navigation from './src/routes/main'
import Splash from './src/screens/splash'
import maniClient from './src/maniClient'
import Loreco from './src/authenticator'
import graphqlClient from './apollo/client'
import { globalStyles } from './src/styles/global'

import config from './aws-config'

import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import './src/helpers/i18n'

Amplify.configure(config)
Analytics.configure({ disabled: true })

log.enableAll()

export const resetClient = async (options = {}) => {
  const mc = await maniClient({ graphqlClient, ...options })
  global.maniClient = mc
  console.log('client/reset', mc.id)
  return mc
}

const App = () => {
  const [state, setState] = useState()

  const Container = ({ children }) => (
    <View style={globalStyles.container}>{children}</View>
  )


  return (
    <Authenticator container={Container} hideDefault onStateChange={setState}>
      <SignIn override={'SignIn'} />
      <SignUp override={'SignUp'} />
      <ConfirmSignUp override={'confirmSignUp'} />
      <VerifyContact override={'verifyContact'} />
      <Loreco />
    </Authenticator>
  )
}

export default App
