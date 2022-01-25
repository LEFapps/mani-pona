import React, { useState, useEffect, useContext } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global'
import Auth from '@aws-amplify/auth'
import Card from '../shared/card'
import CustomButton from '../shared/buttons/button'
import ExportKeys from './auth/_keys'
import { resetClient } from '../../App'
import { useNotifications } from '../shared/notifications'

export default function Home () {
  const { maniClient } = global

  const notification = useNotifications()
  const [email, setEmail] = useState('')
  const [alias, setAlias] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    loadEmailFromUser()
  }, [])

  async function loadEmailFromUser () {
    await Auth.currentSession()
      .then(data => {
        setEmail(data.idToken.payload['email'])
        setAlias(data.idToken.payload['custom:alias'])
      })
      .catch(err => console.log(err))
  }

  async function signOut (clearKeys = false) {
    // Client opted out of this extra notification
    // const proceed = confirm(
    //   'Bent u zeker dat u wil afmelden? Denk eraan om uw sleutels te exporteren als u op een ander toestel wil aanmelden!'
    // )
    // if (!proceed) return
    try {
      if (clearKeys) await maniClient.cleanup()
      await resetClient()
      await Auth.signOut({ global: true })
    } catch (e) {
      console.error('signOut', e)
      notification.add({
        message: e && e.message,
        title: 'Afmelden mislukt',
        type: 'warning'
      })
    }
  }

  return (
    <ScrollView style={globalStyles.main}>
      <View style={{ marginBottom: 10 }}>
        <Card>
          <Text style={globalStyles.cardPropertyText}>Ingelogd als:</Text>
          <Text style={globalStyles.cardValueText}>{alias || '-'}</Text>
        </Card>
        <Card>
          <Text style={globalStyles.cardPropertyText}>E-mailadres:</Text>
          <Text style={globalStyles.cardValueText}>{email || '-'}</Text>
        </Card>
      </View>

      <ExportKeys />
      <CustomButton text='Afmelden' onPress={() => signOut()} />
      {/* <CustomButton
        text='Afmelden en sleutels wissen'
        onPress={() => signOut(true)}
      /> */}
      <Card />
      <CustomButton
        text='Rekening blokkeren'
        onPress={() => setShowInfo(true)}
      />
      {showInfo && (
        <View style={{ marginBottom: 10 }}>
          <Card>
            <Text style={globalStyles.cardValueText}>
              Om je rekening te blokkeren moet je contact opnemen met een{' '}
              {/* TODO: placeholder contact info */}
              <a
                href={`mailto:jonas.van.lancker@howest.be?subject=Account%20blokkeren&body=De%20gebruiker%20met%20username:%20${alias ||
                  '-'}%20en%20email:%20${email ||
                  '-'}%20wenst%20dit%20account%20te%20blokkeren.`}
              >
                administrator
              </a>
            </Text>
          </Card>
        </View>
      )}
    </ScrollView>
  )
}
