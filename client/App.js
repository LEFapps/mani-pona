import React, { useState, useEffect } from 'react'
import { Text, TextInput, View, Dimensions, LogBox } from 'react-native'
import { Authenticator } from 'aws-amplify-react-native'
import { Amplify, Analytics } from 'aws-amplify'
import log from 'loglevel'

import SignIn from './src/screens/auth/signIn'
import Drawer from './src/routes/drawer'
import Splash from './src/screens/splash'
import ManiClient from './src/maniClient'
import graphqlClient from './apollo/client'

import config from './aws-config'

import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import './src/helpers/i18n'

Amplify.configure(config)
Analytics.configure({ disabled: true })

log.enableAll()

export default function App () {
  //fail: 'unknown_id'||'timeout'

  // LogBox.ignoreAllLogs();

  i18n.locale = 'nl-BE' //Localization.locale;
  Text.defaultProps = Text.defaultProps || {}
  Text.defaultProps.allowFontScaling = false
  TextInput.defaultProps = Text.defaultProps || {}
  TextInput.defaultProps.allowFontScaling = false
  const [isSplashFinished, setIsSplashFinished] = useState(false)

  useEffect(async () => {
    global.maniClient = await ManiClient({ graphqlClient })
    setIsSplashFinished(global.maniClient)
  }, [])

  if (isSplashFinished) {
    return (
      <Authenticator
        container={({ children }) => (
          <View
            style={{
              flex: 1,
              width: Dimensions.get('screen').width,
              backgroundColor: '#2B8AA0'
            }}
          >
            {children}
          </View>
        )}
        hideDefault={true}
        authState='signedIn'
        onStateChange={authState => console.log('authState', authState)}
      >
        <SignIn />
        <Drawer />
      </Authenticator>
    )
  } else {
    return <Splash />
  }
}
