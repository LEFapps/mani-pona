import React, { useContext, useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'
import get from 'lodash/get'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import IconButton from '../../shared/buttons/iconButton'
import FlatButton from '../../shared/buttons/historyButton.js'
import Tooltip from '../../shared/tooltip'
import {
  validatePassword,
  validatePasswordRepeat,
  validateVerificationCode
} from '../../helpers/validation'
import { useNotifications } from '../../shared/notifications'
import i18n from 'i18n-js'
import AccountsList from './_accounts.js'

export default function confirmForgotPassword (props) {
  const defaultState = {
    email: get(props, 'authData.username', ''),
    verificationCode: '',
    password: '',
    password2: ''
  }

  const [isBusy, setBusy] = useState(false)
  const [state, setState] = useState(defaultState)
  const [errors, setErrors] = useState(defaultState)
  const [passwordDisplay, setPasswordDisplay] = useState(false)
  const notification = useNotifications()

  const selectAccount = (username, key) => {
    if (key) props.onStateChange('signIn', { username, key })
    else {
      if (username === 'new') props.onStateChange('signUp')
      if (username === 'import') props.onStateChange('signIn', { prompt: true })
      if (username === 'verify') props.onStateChange('confirmSignUp')
      if (username === 'reset') props.onStateChange('forgotPassword')
    }
  }

  async function onSubmit () {
    if (isBusy) return
    const passwordError =
      validatePassword(state.password) ||
      validatePasswordRepeat(state.password, state.password2)
    const verificationCodeError = validateVerificationCode(
      state.verificationCode
    )

    if (passwordError || verificationCodeError) {
      setErrors({
        password: passwordError,
        verificationCode: verificationCodeError
      })
    } else {
      setBusy(true)
      try {
        await Auth.forgotPasswordSubmit(
          get(props, 'authData.username', ''),
          state.verificationCode,
          state.password
        )
        props.onStateChange('signIn')
        notification.add({
          type: 'success',
          title: 'Wachtwoord aangepast!',
          message: 'Je wachtwoord is aangepast, je kan je nu aanmelden.'
        })
        setState(defaultState)
        setBusy(false)
      } catch (e) {
        setBusy(false)
        console.error('forgotPasswordSubmit', e)
        notification.add({
          type: 'danger',
          title: 'Wachtwoord instellen mislukt',
          message: e && e.message
        })
      }
    }
  }

  if (props.authState === 'confirmForgotPassword') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Wachtwoord wijzigen</Text>
        <View style={globalStyles.main}>
          <View>
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

            <Text>
              <Text style={globalStyles.label}>Wachtwoord *</Text>
              <Tooltip
                content='Uw wachtwoord moet minstens 8 tekens bevatten, waarvan 1 cijfer, 1
              hoofdletter, 1 kleine letter en 1 speciaal karakter'
              />
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <TextInput
                secureTextEntry={!passwordDisplay ? true : false}
                style={globalStyles.inputPassword}
                placeholder='Wachtwoord'
                onChangeText={password => {
                  setState({ ...state, password: password })
                  setErrors({ ...errors, password: '' })
                }}
                value={state.password}
              />
              <IconButton
                iconName='eye'
                fromAltSet={true}
                iconColor='white'
                onPress={() => setPasswordDisplay(!passwordDisplay)}
              />
            </View>

            {!!errors.password && (
              <Text style={globalStyles.errorText}>{errors.password}</Text>
            )}

            <Text style={globalStyles.label}>Herhaal wachtwoord *</Text>
            <TextInput
              secureTextEntry={!passwordDisplay ? true : false}
              style={globalStyles.inputPassword}
              placeholder='Herhaal wachtwoord'
              onChangeText={password2 => {
                setState({ ...state, password2 })
                setErrors({ ...errors, password2: '' })
              }}
              value={state.password2}
            />

            {!!errors.password2 && (
              <Text style={globalStyles.errorText}>{errors.password2}</Text>
            )}

            <Button
              text={isBusy ? '• • •' : 'Nieuw wachtwoord instellen'}
              onPress={onSubmit}
            />
          </View>
          <AccountsList onSelect={selectAccount} />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
