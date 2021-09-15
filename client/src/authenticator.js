import React, { useState, useEffect, Fragment } from 'react'
import { Text, TextInput, View, Dimensions, LogBox, Modal } from 'react-native'
import { Authenticator, VerifyContact } from 'aws-amplify-react-native'
import { Amplify, Analytics, Auth } from 'aws-amplify'
import log from 'loglevel'

import SignIn from '../src/screens/auth/signIn'
import SignUp from '../src/screens/auth/signUp'
import ConfirmSignUp from '../src/screens/auth/confirmSignUp'
import Navigation from '../src/routes/main'
import CustomButton from './shared/buttons/button'

import config from '../aws-config'
import { globalStyles } from './styles/global'
import { resetClient } from '../App'

const KeyPrompt = ({ onResolve, ...props }) => {
  const { maniClient } = global

  const [getValue, setValue] = useState('')

  const setKeys = async () => {
    maniClient
      .importKeys(getValue)
      .then(async keys => {
        if (keys) {
          // re-init maniCLient with new keys
          await resetClient()
          onResolve(getValue ? 'pasted' : global.maniClient.id)
        }
      })
      .catch(e => {
        console.error(e)
        setValue('')
      })
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.main}>
        <Text style={globalStyles.bigText}>Welkom bij LoREco!</Text>
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Je bent hier in deze browser of op dit toestel voor het eerst.
          </Text>
        </View>
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Heb je nog geen account? Ga dan verder als nieuwe gebruiker.
          </Text>
        </View>
        <CustomButton
          text={'Doorgaan als nieuwe gebruiker'}
          onPress={setKeys}
          style={{ margin: '1em 0' }}
          disabled={!!getValue}
        />
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Heb je op een ander toestel een account aangemaakt? Plak hieronder
            dan eerst je persoonlijke sleutels die je op je accountpagina kan
            opvragen.
          </Text>
        </View>
        <TextInput
          onChangeText={setValue}
          value={getValue}
          style={{
            width: '100%',
            height: '50vh',
            marginTop: '16px',
            marginBottom: '16px'
          }}
          placeholder={'Plak hier je persoonlijke sleutels'}
          multiline
        />
        <CustomButton
          text={'Sleutels gebruiken'}
          onPress={setKeys}
          style={{
            marginTop: '16px',
            marginBottom: '16px'
          }}
          disabled={!getValue}
        />
      </View>
    </View>
  )
}

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
        if (authState === 'verifyContact') setAuthState('signedIn')
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
    width: Dimensions.get('window').width,
    backgroundColor: '#2B8AA0'
  }
}
