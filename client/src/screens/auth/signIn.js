import React, { useState, useEffect, useContext } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import Auth from '@aws-amplify/auth'
import { validateEmail, validatePasswordLogIn } from '../../helpers/validation'
import { resetClient } from '../../../App.js'
import AccountsList from './_accounts.js'
import { ImportModal } from './keyPrompt.js'
import { KeyManager } from '../../helpers/keymanager.js'
import { keyWarehouse } from '../../maniClient.js'
import { hash } from '../../../shared/crypto.js'
import { useNotifications } from '../../shared/notifications'

export default function SignIn (props = {}) {
  const { authData } = props
  const { username, key, keys, prompt } = authData || {}
  const [state, setState] = useState({
    email: username || '',
    password: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })
  const notification = useNotifications()

  const [isBusy, setBusy] = useState(false)
  const [user, setUser] = useState('')
  const [storageKey, setStorageKey] = useState(key || '')
  const [showPrompt, setPrompt] = useState(!!prompt)
  const [keyValue, setValue] = useState(keys || undefined)

  useEffect(() => {
    setState({ ...state, email: username || '' })
  }, [username])

  useEffect(() => {
    if (keys) setValue(keys)
  }, [keys])

  useEffect(() => {
    if (key) setStorageKey(key)
  }, [key])

  useEffect(() => {
    if (prompt) setPrompt(!!prompt)
  }, [prompt])

  const importKeys = keys => {
    const sk = 'mani_client_key_' + hash()
    setValue(keys)
    setStorageKey(sk)
    notification.add({
      title: 'Sleutels bewaard',
      type: 'warning',
      message: 'Je sleutels werden bewaard. Meld je aan om ze te valideren.'
    })
  }

  const selectAccount = (email, key) => {
    if (key) {
      setStorageKey(key)
      setState({ ...state, email })
      setErrors({ email: '', password: '' })
    } else {
      if (email === 'new') props.onStateChange('signUp')
      if (email === 'import') setPrompt(true)
      if (email === 'verify') props.onStateChange('confirmSignUp')
      if (email === 'reset') props.onStateChange('forgotPassword')
    }
  }

  async function onSubmit () {
    if (isBusy) return
    const emailError = validateEmail(state.email)
    const passwordError = validatePasswordLogIn(state.password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
    } else {
      setBusy(true)
      try {
        const user = await Auth.signIn({
          username: state.email,
          password: state.password
        })

        setUser(user)

        const { 'custom:ledger': ledgerId, email } = user.attributes
        if (keyValue) {
          const keyManager = await KeyManager(
            keyWarehouse.getKeyStore(storageKey)
          )
          keyManager.setKeys(keyValue, email)
        }
        if (!ledgerId)
          props.onStateChange('verifyContact', {
            storageKey,
            keyValue,
            username: email,
            email,
            ...user
          })
        else {
          // init maniClient with ledger's keys
          try {
            await resetClient({ storageKey })
          } catch (e) {
            props.onStateChange('signedOut')
          }
          const { maniClient } = global
          if (maniClient && ledgerId === maniClient.id)
            props.onStateChange('signedIn')
          else {
            await Auth.signOut()
            props.onStateChange('signedOut')
            notification.add({
              type: 'warning',
              title: 'Kies het juiste account',
              message:
                'Je hebt je aangemeld met een account dat niet bij deze sleutels hoort, probeer opnieuw aub!'
            })
          }
        }
        setState({
          email: '',
          password: ''
        })
        setBusy(false)
      } catch ({ code, message }) {
        setBusy(false)
        console.error('signIn', message)
        let customMessage = null
        if (message === 'User is disabled.')
          // customMessage =
          //   'Uw rekening is geblokkeerd, voor vragen en deblokkering gelieve contact op te nemen met jonas.van.lancker@howest.be'
          customMessage =
            'Uw rekening is geblokkeerd, voor vragen en deblokkering gelieve contact op te nemen met een administrator.'
        notification.add({
          title: 'Aanmelden mislukt',
          message: customMessage || message,
          type: 'danger'
        })
      }
    }
  }

  if (props.authState === 'signIn') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Aanmelden</Text>
        <View style={globalStyles.main}>
          {(!!storageKey || !!state.email) && (
            <View>
              <Text style={globalStyles.label}>E-mail</Text>
              <TextInput
                style={globalStyles.input}
                placeholder='E-mail'
                onChangeText={email => {
                  setState({ ...state, email: email.toLowerCase() })
                  setErrors({ ...errors, email: '' })
                }}
                value={state.email}
                // editable={!state.email}
              />

              {!!errors.email && (
                <Text style={globalStyles.errorText}>{errors.email}</Text>
              )}

              <Text style={globalStyles.label}>Wachtwoord</Text>
              <TextInput
                secureTextEntry={true}
                style={globalStyles.input}
                placeholder='Wachtwoord'
                onChangeText={password => {
                  setState({ ...state, password: password })
                  setErrors({ ...errors, password: '' })
                }}
                value={state.password}
              />

              {!!errors.password && (
                <Text style={globalStyles.errorText}>{errors.password}</Text>
              )}

              <Button
                text={isBusy ? '• • •' : 'Bevestigen'}
                onPress={onSubmit}
              />
            </View>
          )}

          {showPrompt && (
            <ImportModal
              onValue={keys => {
                importKeys(keys)
                setPrompt(false)
                setState({ ...state, email: '' })
              }}
              isOpen={showPrompt}
              setOpen={setPrompt}
            />
          )}

          <AccountsList onSelect={selectAccount} />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
