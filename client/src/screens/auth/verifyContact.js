import React, { useEffect, useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import HistoryButton from '../../shared/buttons/historyButton'
import Auth from '@aws-amplify/auth'
import {
  validateEmail,
  validatePassword,
  validatePasswordLogIn,
  validateVerificationCode
} from '../../helpers/validation'
import { resetClient } from '../../../App'
import { keyWarehouse } from '../../maniClient.js'
import Alert from '../../shared/alert'
import { GotoSignUp, GotoSignIn } from './StateManagers.js'
import i18n from 'i18n-js'
import Dialog from 'react-native-dialog'
import { AppIntegrations } from 'aws-sdk'

export default function verifyContact ({ authState, authData, onStateChange }) {
  const { storageKey, keyValue, email, ...user } = authData || {}

  const [alias, setAlias] = useState(email || '')
  const [pin, setPin] = useState('')
  const [offline, setOffline] = useState(false)
  const [errors, setErrors] = useState([])

  const onSubmit = async () => {
    if (checkForErrors()) return

    // init maniClient for account fetching
    let fetchedKey = ''
    if (!storageKey)
      fetchedKey = (
        (await keyWarehouse.list()).find(
          ({ username }) => username === email
        ) || {}
      ).key
    await resetClient({ storageKey: storageKey || fetchedKey })
    const { maniClient } = global
    await maniClient.register(alias)

    onStateChange('signedIn')
  }

  const checkForErrors = () => {
    const errs = []
    if (!alias.length) errs.push('Alias mag niet leeg zijn.')
    // if (pin.length < 4) errs.push('Pin moet minstens 4 tekens bevatten.')
    setErrors(errs)
    return !!errs.length
  }

  if (authState === 'verifyContact') {
    // add attributes
    // - pin
    // - offline
    // - alias (verify)
    // - keys (hidden)

    return (
      <View>
        <Text style={globalStyles.label}>Alias</Text>
        <TextInput
          style={globalStyles.input}
          onChangeText={setAlias}
          defaultValue={
            (user && user.attributes && user.attributes.email) || email
          }
        />

        {/* <Text style={globalStyles.label}>PIN-code (min. 4 cijfers)</Text>
        <TextInput
          style={globalStyles.input}
          onChangeText={setPin}
          placeholder={'****'}
        />

        <Text style={globalStyles.label}>Betalen zonder toestel?</Text>
        <HistoryButton
          options={[
            {
              title: 'Ja, rekening offline beschikbaar',
              active: () => !!offline,
              onPress: () => setOffline(true)
            },
            {
              title: 'Enkel online betalen',
              active: () => !offline,
              onPress: () => setOffline(false)
            }
          ]}
        /> */}

        {!!errors.length &&
          errors.map((e, i) => (
            <Text style={globalStyles.errorText} key={i}>
              {e}
            </Text>
          ))}

        <Button text='Rekening openen' onPress={onSubmit} />
      </View>
    )
  }

  return null
}
