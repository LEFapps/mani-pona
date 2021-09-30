import React, { useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import FlatButton from '../../shared/buttons/historyButton.js'
import {
  validateEmail,
  validatePassword,
  validatePasswordRepeat
} from '../../helpers/validation'
import Alert from '../../shared/alert'
import { GotoConfirmSignUp, GotoSignIn } from './StateManagers.js'
import i18n from 'i18n-js'
import { resetClient } from '../../../App.js'

export default function signUp (props) {
  const defaultState = {
    alias: '',
    email: '',
    password: '',
    password2: '',
    requestedType: 'default'
  }

  const [state, setState] = useState(defaultState)
  const [errors, setErrors] = useState(defaultState)

  async function onSubmit () {
    const emailError = validateEmail(state.email)
    const passwordError =
      validatePassword(state.password) ||
      validatePasswordRepeat(state.password, state.password2)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
    } else {
      setState(defaultState)
      try {
        await resetClient()
        const { userConfirmed } = await Auth.signUp({
          username: state.email,
          password: state.password,
          attributes: {
            'custom:requestedType': state.requestedType,
            'custom:alias': state.alias,
            'custom:ledger': global.maniClient.id,
            email: state.email
          }
        })
        if (userConfirmed)
          props.onStateChange('signIn', { username: state.email })
        else props.onStateChange('confirmSignUp', { username: state.email })
      } catch (error) {
        console.log(error)
        Alert.alert(i18n.t(error.code))
      }
    }
  }

  const accountTypes = [
    {
      title: 'Standaardaccount',
      onPress: () => setState({ ...state, requestedType: 'default' }),
      active: () => state.requestedType === 'default'
    },
    {
      title: 'Professioneel account',
      onPress: () => setState({ ...state, requestedType: 'professional' }),
      active: () => state.requestedType === 'professional'
    }
  ]

  if (props.authState === 'signUp') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Registreren</Text>
        <View style={globalStyles.main}>
          <View>
            <Text style={globalStyles.label}>Schermnaam</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='Eigennaam of bedrijfsnaam'
              onChangeText={alias => {
                setState({ ...state, alias })
                setErrors({})
              }}
              value={state.alias}
            />

            {!!errors.alias && (
              <Text style={globalStyles.errorText}>{errors.alias}</Text>
            )}

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

            <Text style={globalStyles.label}>Wachtwoord</Text>
            <TextInput
              secureTextEntry={true}
              style={globalStyles.input}
              placeholder='Wachtwoord'
              onChangeText={password => {
                setState({ ...state, password: password })
                setErrors({})
              }}
              value={state.password}
            />

            {!!errors.password && (
              <Text style={globalStyles.errorText}>{errors.password}</Text>
            )}

            <Text style={globalStyles.label}>Herhaal wachtwoord</Text>
            <TextInput
              secureTextEntry={true}
              style={globalStyles.input}
              placeholder='Herhaal wachtwoord'
              onChangeText={password2 => {
                setState({ ...state, password2 })
                setErrors({})
              }}
              value={state.password2}
            />

            {!!errors.password2 && (
              <Text style={globalStyles.errorText}>{errors.password2}</Text>
            )}

            <Text style={globalStyles.label}>Account Type</Text>
            <FlatButton options={accountTypes} />

            <Button text='Registreren' onPress={() => onSubmit()} />

            <GotoSignIn {...props} />
            <GotoConfirmSignUp {...props} />
          </View>
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
