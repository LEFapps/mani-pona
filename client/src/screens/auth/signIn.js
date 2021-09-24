import React, { useState, useEffect } from 'react'
import { TextInput, View, Text, Platform } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import Auth from '@aws-amplify/auth'
import {
  validateEmail,
  validatePassword,
  validatePasswordLogIn
} from '../../helpers/validation'
import Alert from '../../shared/alert'
import { GotoSignUp, GotoConfirmSignUp } from './StateManagers.js'
import i18n from 'i18n-js'
import Dialog from 'react-native-dialog'

export default function SignIn (props = {}) {
  const { authData } = props
  const { username } = authData || {}
  const [state, setState] = useState({
    email: username || '',
    password: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })

  const [user, setUser] = useState('')

  const [newPassFirst, setNewPassFirst] = useState('')
  const [newPassSecond, setNewPassSecond] = useState('')

  const [requirePass, setRequirePass] = useState(false)
  const [passControle, setPassControle] = useState(false)

  useEffect(() => {
    setState({ ...state, email: username || '' })
  }, [username])

  function showResetPass () {
    setRequirePass(true)
  }

  function hideResetCancel () {
    setRequirePass(false)
    setNewPassFirst('')
  }

  function hideReset () {
    setRequirePass(false)
  }

  function hideControle () {
    setPassControle(false)
  }

  function showPasswordControle () {
    setPassControle(true)
  }

  async function newPassword (newPass) {
    try {
      const changePassword = await Auth.completeNewPassword(user, newPass)
    } catch (error) {
      Alert.alert(error.message)
    }
  }

  async function onSubmit () {
    const emailError = validateEmail(state.email)
    const passwordError = validatePasswordLogIn(state.password)

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
    } else {
      setState({
        email: '',
        password: ''
      })
      try {
        const user = await Auth.signIn({
          username: state.email,
          password: state.password
        })

        setUser(user)

        if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
          if (Platform.OS === 'ios') {
            Alert.prompt(
              'Nieuw wachtwoord vereist',
              'Aangezien dit de eerste keer is dat u probeert in te loggen, dient u een nieuw wachtwoord in te voeren.',
              [
                {
                  text: 'Annuleren',
                  onPress: () =>
                    Alert.alert('Nieuw wachtwoord instellen geannuleerd')
                },
                {
                  text: 'OK',
                  onPress: newPassFirst => {
                    if (!validatePassword(newPassFirst)) {
                      Alert.prompt(
                        'Nieuw wachtwoord opnieuw',
                        'Geef het wachtwoord opnieuw in voor controle',
                        [
                          {
                            text: 'OK',
                            onPress: newPassSecond => {
                              if (newPassFirst === newPassSecond) {
                                newPassword(newPassFirst)
                              } else {
                                Alert.alert(
                                  'Wachtwoorden niet hetzelfde, probeer opnieuw'
                                )
                              }
                            }
                          }
                        ],
                        'secure-text'
                      )
                    } else {
                      Alert.alert(validatePassword(newPassFirst))
                    }
                  }
                }
              ],
              'secure-text'
            )
          } else if (Platform.OS === 'android') {
            showResetPass()
          }
        }
      } catch (error) {
        console.log(error)
        Alert.alert(i18n.t(error.code))
      }
    }
  }

  if (props.authState === 'signIn') {
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

            <Button text='Bevestigen' onPress={() => onSubmit()} />

            <GotoSignUp {...props} />
            <GotoConfirmSignUp {...props} />

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
