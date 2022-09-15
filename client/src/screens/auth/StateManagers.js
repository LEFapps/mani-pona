import React from 'react'
import { Text } from 'react-native'
import { globalStyles } from '../../styles/global.js'

export const GotoSignIn = ({ onStateChange }) => {
  const goto = () => onStateChange('signIn', {})
  return (
    <Text style={globalStyles.label} onPress={goto}>
      Ik heb al een account en ik wil me aanmelden.
    </Text>
  )
}

export const GotoSignUp = ({ onStateChange }) => {
  const goto = () => onStateChange('signUp', {})
  return (
    <Text style={globalStyles.label} onPress={goto}>
      Ik heb nog geen account en ik wil me registreren.
    </Text>
  )
}

export const GotoConfirmSignUp = ({ onStateChange }) => {
  const goto = () => onStateChange('confirmSignUp', {})
  return (
    <Text style={globalStyles.label} onPress={goto}>
      Ik heb net een account gemaakt en ik wil me verifiëren.
    </Text>
  )
}

export const GotoResetPassword = ({ onStateChange }) => {
  const goto = () => onStateChange('forgotPassword', {})
  return (
    <Text style={globalStyles.label} onPress={goto}>
      Ik ben mijn wachtwoord vergeten.
    </Text>
  )
}
