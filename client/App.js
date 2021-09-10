import React, { useState, useEffect } from 'react'
import { Text, TextInput, View, Dimensions, LogBox } from 'react-native'
import { Authenticator, VerifyContact } from 'aws-amplify-react-native'
import { Amplify, Analytics } from 'aws-amplify'
import log from 'loglevel'

import SignIn from './src/screens/auth/signIn'
import SignUp from './src/screens/auth/signUp'
import ConfirmSignUp from './src/screens/auth/confirmSignUp'
import Navigation from './src/routes/main'
import Splash from './src/screens/splash'
import ManiClient from './src/maniClient'
import graphqlClient from './apollo/client'

import Button from './src/shared/buttons/button'

import config from './aws-config'

import * as Localization from 'expo-localization'
import i18n, { placeholder } from 'i18n-js'
import './src/helpers/i18n'
import { globalStyles } from './src/styles/global'

Amplify.configure(config)
Analytics.configure({ disabled: true })

log.enableAll()

const KeyPrompt = ({ onInsert }) => {
  const [keyString, setString] = useState('')
  const setKey = () => {
    global.maniClient
      .importKeys(keyString)
      .then(i => {
        return global.maniClient.run()
      })
      .then(r => {
        onInsert()
      })
  }
  return (
    <View>
      <Text>Welkom bij LoREco.</Text>
      <TextInput
        value={keyString}
        onChangeText={setString}
        multiline
        style={{ height: '50vh' }}
        placeholder='Plak hier je sleutels of klik doorgaan om een nieuw account te maken.'
      />
      <Button text='Doorgaan' onPress={setKey} />
    </View>
  )
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
  const [showKeyPrompt, setKeyPrompt] = useState(true)

  useEffect(() => {
    setupClient().then(() => checkKeys())
  }, [])

  const setupClient = async () => {
    log.debug('Starting ManiClient')
    global.maniClient = await ManiClient({ graphqlClient })
    setIsSplashFinished(!!global.maniClient)
  }

  const checkKeys = async () => {
    const hk = await global.maniClient.hasKeys()
    if (hk) await setupClient()
    setKeyPrompt(!hk)
  }

  if (isSplashFinished) {
    return showKeyPrompt ? (
      <KeyPrompt onInsert={checkKeys} />
    ) : (
      <Authenticator
        container={({ children }) => (
          <View
            style={{
              flex: 1,
              width: Dimensions.get('window').width,
              backgroundColor: '#2B8AA0'
            }}
          >
            {children}
          </View>
        )}
        hideDefault
        authState={'signIn'}
        onStateChange={authState => {
          if (authState === 'verifyContact') setAuthState('signedIn')
        }}
      >
        <SignIn override={'SignIn'} />
        <SignUp override={'SignUp'} />
        <ConfirmSignUp override={'confirmSignUp'} />
        <VerifyContact />
        <Navigation />
      </Authenticator>
    )
  } else {
    return <Splash />
  }
}
