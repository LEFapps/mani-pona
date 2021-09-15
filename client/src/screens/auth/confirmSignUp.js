import React, { useState } from 'react'
import { TextInput, View, Text, Alert, Platform } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import Auth from '@aws-amplify/auth'
import {
  validateEmail,
  validatePassword,
  validatePasswordLogIn,
  validateVerificationCode
} from '../../helpers/validation'
import { GotoSignUp, GotoSignIn } from './StateManagers.js'
import i18n from 'i18n-js'
import Dialog from 'react-native-dialog'

export default function confirmSignUp (props) {
  const { maniClient } = global
  const [state, setState] = useState({
    email: '',
    verificationCode: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    verificationCode: ''
  })

  const [user, setUser] = useState('')

  const [newPassFirst, setNewPassFirst] = useState('')
  const [newPassSecond, setNewPassSecond] = useState('')

  const [requirePass, setRequirePass] = useState(false)
  const [passControle, setPassControle] = useState(false)

  async function onSubmit () {
    const emailError = validateEmail(state.email)
    const verificationCodeError = validateVerificationCode(
      state.verificationCode
    )

    if (emailError || verificationCodeError) {
      setErrors({ email: emailError, verificationCode: verificationCodeError })
    } else {
      setState({
        email: '',
        verificationCode: ''
      })
      try {
        await Auth.confirmSignUp(state.email, state.verificationCode)
        await maniClient.register(state.email)
        props.onStateChange('signIn', {})
      } catch (error) {
        console.log(error)
        Alert.alert(i18n.t(error.code))
      }
    }
  }

  if (props.authState === 'confirmSignUp') {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Log In</Text>
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

            <Button text='Verifiëren' onPress={() => onSubmit()} />

            <GotoSignIn {...props} />
            <GotoSignUp {...props} />

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
                  Alert.alert(
                    'Geannuleerd',
                    'Nieuw wachtwoord instellen geannuleerd'
                  )
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
                    Alert.alert(
                      'Wachtwoord fout',
                      validatePassword(newPassFirst)
                    )
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
                    Alert.alert(
                      'Wachtwoord fout',
                      'Wachtwoorden niet hetzelfde, probeer opnieuw'
                    )
                  }
                }}
              />
            </Dialog.Container>
          </View>
        </View>
      </View>
    )
  } else {
    return null
  }
}
