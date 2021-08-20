import React, { useState } from 'react'
import { TextInput, View, Text, Alert, Platform } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import Auth from '@aws-amplify/auth'
import {
  validateEmail,
  validatePassword,
  validatePasswordRepeat
} from '../../helpers/validation'
import i18n from 'i18n-js'

export default function signUp (props) {
  const ManiClient = global.maniClient

  const [state, setState] = useState({
    email: '',
    password: '',
    password2: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    password2: ''
  })

  const [user, setUser] = useState('')

  async function onSubmit () {
    const emailError = validateEmail(state.email)
    const passwordError =
      validatePassword(state.password) ||
      validatePasswordRepeat(state.password, state.password2)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
    } else {
      setState({
        email: '',
        password: '',
        password2: ''
      })
      try {
        await Auth.signUp({
          username: state.email,
          password: state.password,
          attributes: {
            // insert fingerprint here ?
          }
        })

        await ManiClient.register(state.email)

        const user = await Auth.signIn(state.email, state.password)
        setUser(user)
      } catch (error) {
        console.log(error)
        Alert.alert(i18n.t(error.code))
      }
    }
  }

  if (props.authState === 'signIn') {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Registreren</Text>
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

            <Button text='Registreren' onPress={() => onSubmit()} />
          </View>
        </View>
      </View>
    )
  } else {
    return null
  }
}