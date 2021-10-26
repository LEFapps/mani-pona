import React, { useState } from 'react'
import { TextInput, View, Text } from 'react-native'
import Auth from '@aws-amplify/auth'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import { resetClient } from '../../../App'
import { keyWarehouse } from '../../maniClient.js'

export default function verifyContact ({ authState, authData, onStateChange }) {
  const { storageKey, keyValue, email, ...user } = authData || {}

  const [alias, setAlias] = useState(
    (user && user.attributes && user.attributes['custom:alias']) || email
  )
  // const [pin, setPin] = useState('')
  // const [offline, setOffline] = useState(false)
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
    const r = await maniClient.register(alias)

    // TODO: reset user context after registering
    // the following lines are untested, and probably not necessary
    // the ledger is already set in the maniClient and the user
    // react context is not currently being updated for now
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser()
      const currentSession = await Auth.currentSession()
      await cognitoUser.refreshSession(
        currentSession.refreshToken,
        async (err, session) => {
          const { idToken, refreshToken, accessToken } = session
          // do whatever you want to do now :)
          const newCognitoUser = await Auth.currentAuthenticatedUser({
            bypassCache: true
          })
          onStateChange('signedIn', { ...newCognitoUser })
        }
      )
    } catch (e) {
      console.log('Unable to refresh Token', e)
    }

    // onStateChange('signedIn')
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
          defaultValue={alias}
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
