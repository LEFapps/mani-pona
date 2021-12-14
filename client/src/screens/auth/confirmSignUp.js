import React, { useContext, useEffect, useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import Auth from '@aws-amplify/auth'
import {
  validateEmail,
  validatePassword,
  validateVerificationCode
} from '../../helpers/validation'
import Dialog from 'react-native-dialog'
import AccountsList from './_accounts.js'
import { keyWarehouse } from '../../maniClient.js'
import { hash } from '../../../shared/crypto.js'
import { KeyManager } from '../../helpers/keymanager.js'
import { useNotifications } from '../../shared/notifications.js'

export default function confirmSignUp (props = {}) {
  const { authData } = props
  const { username } = authData || {}

  const notification = useNotifications()

  const [isBusy, setBusy] = useState()
  const [state, setState] = useState({
    email: username || '',
    verificationCode: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    verificationCode: ''
  })

  const [newPassFirst, setNewPassFirst] = useState('')
  const [newPassSecond, setNewPassSecond] = useState('')

  const [requirePass, setRequirePass] = useState(false)
  const [passControle, setPassControle] = useState(false)

  useEffect(() => {
    setState({ ...state, email: username || '' })
  }, [username])

  const selectAccount = (username, key) => {
    if (key) props.onStateChange('signIn', { username, key })
    else {
      if (username === 'new') props.onStateChange('signUp')
      if (username === 'import') props.onStateChange('signIn', { prompt: true })
      if (username === 'verify') props.onStateChange('confirmSignUp')
    }
  }

  async function onSubmit () {
    const emailError = validateEmail(state.email)
    const verificationCodeError = validateVerificationCode(
      state.verificationCode
    )

    if (emailError || verificationCodeError) {
      setErrors({ email: emailError, verificationCode: verificationCodeError })
    } else {
      setBusy(true)
      try {
        await Auth.confirmSignUp(state.email, state.verificationCode)

        const storageKey = 'mani_client_key_' + hash()
        const keyManager = await KeyManager(
          keyWarehouse.getKeyStore(storageKey)
        )
        const keyValue = keyManager.setKeys(false, state.email)
        props.onStateChange('signIn', {
          username: state.email,
          storageKey,
          keyValue
        })
        notification.add({
          type: 'success',
          message: 'Je verificatie is gelukt, je kan je nu aanmelden.',
          title: 'Je verificatie is gelukt, je kan je nu aanmelden.'
        })
        setBusy(false)
      } catch (e) {
        setBusy(false)
        console.error('confirmSignup', e)
        notification.add({
          type: 'warning',
          message: e && e.message,
          title: 'Verificatie mislukt'
        })
      }
    }
  }

  if (props.authState === 'confirmSignUp') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Verificatie</Text>
        <View style={globalStyles.main}>
          <View>
            <Text style={globalStyles.label}>E-mail</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='E-mail'
              onChangeText={email => {
                setState({ ...state, email: email.toLowerCase() })
                setErrors({})
              }}
              value={state.email}
            />

            {!!errors.email && (
              <Text style={globalStyles.errorText}>{errors.email}</Text>
            )}

            <Text style={globalStyles.label}>Verificatiecode</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='123456'
              onChangeText={verificationCode => {
                setState({ ...state, verificationCode: verificationCode })
                setErrors({})
              }}
              value={state.verificationCode}
            />

            {!!errors.verificationCode && (
              <Text style={globalStyles.errorText}>
                {errors.verificationCode}
              </Text>
            )}

            <Button text={isBusy ? '• • •' : 'Verifiëren'} onPress={onSubmit} />

            <AccountsList onSelect={selectAccount} />

            <Dialog.Container visible={requirePass}>
              <Dialog.Title>Nieuw wachtwoord vereist</Dialog.Title>
              <Dialog.Description>
                Aangezien dit de eerste keer is dat u probeert in te loggen,
                dient u een nieuw wachtwoord in te voeren.
              </Dialog.Description>
              <Dialog.Input
                secureTextEntry={true}
                placeholder='Wachtwoord'
                onChangeText={newPassFirst => setNewPassFirst(newPassFirst)}
                value={newPassFirst}
              />
              <Dialog.Button
                label='Annuleren'
                onPress={() => {
                  hideResetCancel()
                  notification.add({
                    type: 'info',
                    message: 'Nieuw wachtwoord instellen geannuleerd',
                    title: 'Gennuleerd'
                  })
                }}
              />
              <Dialog.Button
                label='Ok'
                onPress={() => {
                  hideReset()
                  if (!validatePassword(newPassFirst)) {
                    showPasswordControle()
                  } else {
                    setNewPassFirst('')
                    notification.add({
                      type: 'warning',
                      title: 'Wachtwoord fout',
                      message: validatePassword(newPassFirst)
                    })
                  }
                }}
              />
            </Dialog.Container>

            <Dialog.Container visible={passControle}>
              <Dialog.Title>Nieuw wachtwoord opnieuw</Dialog.Title>
              <Dialog.Description>
                Geef het wachtwoord opnieuw in voor controle
              </Dialog.Description>
              <Dialog.Input
                secureTextEntry={true}
                placeholder='Wachtwoord'
                onChangeText={newPassSecond => {
                  setNewPassSecond(newPassSecond)
                }}
                value={newPassSecond}
              />
              <Dialog.Button
                label='Ok'
                onPress={() => {
                  if (newPassFirst === newPassSecond) {
                    newPassword(newPassFirst)
                    hideControle()
                  } else {
                    notification.add({
                      type: 'warning',
                      title: 'Wachtwoord fout',
                      message: 'Wachtwoorden niet hetzelfde, probeer opnieuw'
                    })
                  }
                }}
              />
            </Dialog.Container>
          </View>
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
