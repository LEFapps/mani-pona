import React, { useState, useEffect } from 'react'
import { View, Text, Alert } from 'react-native'
import { globalStyles } from '../styles/global'
import Auth from '@aws-amplify/auth'
import Card from '../shared/card'
import CustomButton from '../shared/buttons/button'
import ExportKeys from './_keys'

export default function Home () {
  const [email, setEmail] = useState('')
  const [alias, setAlias] = useState('')

  useEffect(() => {
    loadEmailFromUser()
  }, [])

  async function loadEmailFromUser () {
    await Auth.currentSession()
      .then(data => {
        setEmail(data.idToken.payload['email'])
        setAlias(data.idToken.payload['alias'])
      })
      .catch(err => console.log(err))
  }

  async function signOut () {
    try {
      await Auth.signOut({ global: true })
    } catch (error) {
      Alert.alert('error signing out: ', error)
    }
  }

  return (
    <View style={globalStyles.main}>
      <View style={{ marginBottom: 10 }}>
        <Card>
          <View style={{ flexDirection: 'row' }}>
            <View style={globalStyles.cardPropertys}>
              <Text style={globalStyles.cardPropertyText}>Ingelogd als:</Text>
              <Text style={globalStyles.cardPropertyText}>E-mailadres:</Text>
            </View>
            <View style={globalStyles.cardValues}>
              <Text style={globalStyles.cardValueText}>{alias || '-'}</Text>
              <Text style={globalStyles.cardValueText}>{email || '-'}</Text>
            </View>
          </View>
        </Card>
      </View>
      <ExportKeys />
      <CustomButton text='Afmelden' onPress={() => signOut()} />
    </View>
  )
}
