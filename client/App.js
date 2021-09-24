import React, { useState, useEffect } from 'react'
import { Text, TextInput, View, Dimensions, LogBox } from 'react-native'
import { Amplify, Analytics } from 'aws-amplify'
import log from 'loglevel'

import SignIn from './src/screens/auth/signIn'
import SignUp from './src/screens/auth/signUp'
import ConfirmSignUp from './src/screens/auth/confirmSignUp'
import Navigation from './src/routes/main'
import Splash from './src/screens/splash'
import maniClient from './src/maniClient'
import Authenticator from './src/authenticator'
import graphqlClient from './apollo/client'

import config from './aws-config'

import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import './src/helpers/i18n'

Amplify.configure(config)
Analytics.configure({ disabled: true })

log.enableAll()

export const resetClient = async () => {
  const mc = await maniClient({ graphqlClient })
  global.maniClient = mc
  console.log('resetting client', mc.id)
  return mc
}

export default function App () {
  // fail: 'unknown_id'||'timeout'

  // LogBox.ignoreAllLogs();

  i18n.locale = 'nl-BE' // Localization.locale;
  Text.defaultProps = Text.defaultProps || {}
  Text.defaultProps.allowFontScaling = false
  TextInput.defaultProps = Text.defaultProps || {}
  TextInput.defaultProps.allowFontScaling = false

  const [isSplashFinished, setIsSplashFinished] = useState(false)

  useEffect(() => {
    setupClient()
  }, [])

  const setupClient = async () => {
    log.debug('Starting ManiClient')
    await resetClient()
    setIsSplashFinished(!!global.maniClient)
  }

  console.log('isSplashFinished', isSplashFinished)

  return isSplashFinished ? <Authenticator /> : <Splash />
}
