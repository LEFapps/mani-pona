import React, { useState } from 'react'
import { TextInput, View, Text, Alert } from 'react-native'
import { globalStyles } from '../styles/global.js'
import Button from '../shared/buttons/button'
import { validateNotEmpty } from '../helpers/validation'
import ManiClient from '../mani'

export default function AddContact ({ route, navigation }) {
  const { type, data } = route.params
  const [state, setState] = useState({
    contactName: ''
  })
  const [errors, setErrors] = useState({
    contactName: ''
  })

  async function addContact () {
    let lastId = null
    await ManiClient.contacts.all().then(contacts => {
      lastId = contacts[contacts.length - 1]['contactId']
    })
    Alert.alert('Niet Geimplementeerd')
    navigation.navigate('Transaction', { contactId: lastId + 1, peerId: data })
  }

  async function onSubmit () {
    const contactNameErr = validateNotEmpty(state.contactName)
    if (contactNameErr) {
      setErrors({ contactName: contactNameErr })
    } else {
      addContact()
      setState({
        contactName: ''
      })
    }
  }

  return (
    <View style={globalStyles.main}>
      <View>
        <Text style={globalStyles.label}>Contact Naam</Text>
        <TextInput
          style={globalStyles.input}
          placeholder='Contact Naam'
          onChangeText={contactName => {
            setState({ ...state, contactName: contactName })
            setErrors({})
          }}
          value={state.contactName}
        />

        {!!errors.contactName && (
          <Text style={globalStyles.errorText}>{errors.contactName}</Text>
        )}

        <Button text='Bevestigen' onPress={() => onSubmit()} />
        <Button
          color='maroon'
          text='Contact niet toevoegen'
          onPress={() =>
            navigation.navigate('Transaction', { contactId: '', peerId: data })
          }
        />

        <Text style={globalStyles.text}>
          U kunt kiezen om de zonet gescande QR-code toe te voegen als contact
          voor eventueel later gebruik. Voeg niet toe om deze anoniem te laten.
        </Text>
      </View>
    </View>
  )
}
