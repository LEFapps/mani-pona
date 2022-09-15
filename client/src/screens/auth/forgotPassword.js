import React, { useContext, useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import { validateEmail } from '../../helpers/validation'
import { useNotifications } from '../../shared/notifications'
import i18n from 'i18n-js'
import { resetClient } from '../../../App.js'
import AccountsList from './_accounts.js'

export default function forgotPassword (props) {
  const defaultState = {
    alias: '',
    email: ''
  }

  const [isBusy, setBusy] = useState(false)
  const [state, setState] = useState(defaultState)
  const [errors, setErrors] = useState(defaultState)
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
    const emailError = validateEmail(state.email)

    if (emailError) {
      setErrors({
        email: emailError
      })
    } else {
      setBusy(true)
      try {
        // await resetClient()
        const { CodeDeliveryDetails } = await Auth.forgotPassword(state.email)
        if (CodeDeliveryDetails) {
          props.onStateChange('confirmForgotPassword', {
            username: state.email
          })
          notification.add({
            type: 'success',
            title: 'Aanvraag verzonden!',
            message: `Je aanvraag is verzonden, vul een nieuw wachtwoord in met de code die je ontvangen hebt via ${CodeDeliveryDetails.AttributeName}.`
          })
        }
        setState(defaultState)
        setBusy(false)
      } catch (e) {
        setBusy(false)
        console.error('forgotPassword', e)
        notification.add({
          type: 'danger',
          title: `Aanvraag mislukt`,
          message: e && e.message
        })
      }
    }
  }

  if (props.authState === 'forgotPassword') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Wachtwoord wijzigen</Text>
        <View style={globalStyles.main}>
          <View>
            <Text style={globalStyles.label}>E-mail *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='E-mailadres'
              onChangeText={email => {
                setState({ ...state, email: email.toLowerCase() })
                setErrors({ ...errors, email: '' })
              }}
              value={state.email}
            />

            {!!errors.email && (
              <Text style={globalStyles.errorText}>{errors.email}</Text>
            )}

            <Button
              text={isBusy ? '• • •' : 'Aanvraag verzenden'}
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
