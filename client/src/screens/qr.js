import React, { useContext, useState } from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import RoundButton from '../shared/buttons/roundIconButton'
import BigCardWithButtons from '../shared/bigCardWithButtons'
import Camera from '../shared/camera'
import MANI from '../../shared/mani'
import Card from '../shared/card'

import { globalStyles } from '../styles/global'
import { Contact } from '../shared/contact'
import log from 'loglevel'
import { TextInput } from 'react-native-paper'
import { useNotifications } from '../shared/notifications'

export default function Home ({ navigation }) {
  const { maniClient } = global

  const notification = useNotifications()

  const isFocused = useIsFocused()
  const [getData, setData] = useState()
  const [getSign, setSign] = useState()
  const [getError, setError] = useState([])
  const reset = () => {
    setData()
    setError()
  }

  const readChallenge = (data = 'loreco://null') => {
    log.debug('scanned data', data)
    const [action, ...params] = data
      .split('://')
      .pop()
      .split('/')
    log.debug('scanned action', action)
    if (action === 'scan') {
      const [destination, incomingAmount = 0, message] = params || []
      log.debug('Scanned', destination, incomingAmount, message)
      const prepaid = incomingAmount === '__prepaid__'
      const amount = prepaid ? 0 : Number(incomingAmount) / 100
      setData({
        destination,
        amount: Math.abs(amount).toString(),
        message: message ? decodeURIComponent(message) : '',
        prepaid
      })
      setSign(amount >= 0 ? 1 : -1)
    } else setData()
  }

  const createChallenge = async () => {
    setError([])
    const { destination, amount, message, prepaid } = getData
    await maniClient.transactions
      .challenge(
        destination,
        MANI(Math.abs(parseFloat(amount.replace(',', '.'))) * getSign)
      )
      .then(challenge => {
        // console.log('CHALLENGE', challenge)
        return maniClient.transactions.create(challenge, message, prepaid)
      })
      .catch(e => {
        console.error('transactions/challenge', e)
        notification.add({
          type: 'danger',
          title: 'Er ging iets mis.',
          message: 'De transactie werd afgebroken'
        })
      })
      .then(create => {
        if (create) {
          if (create.entry === 'current') navigation.navigate('AccountBalance')
          else if (create.entry === 'pending')
            navigation.navigate('Openstaande betalingen')
          else navigation.navigate('AccountBalance')
        }
      })
      .catch(e => {
        console.error('transactions/create', e)
        notification.add({
          type: 'danger',
          title: 'Er ging iets mis.',
          message: 'Transactie starten mislukt'
        })
      })
    reset()
  }

  return (
    <ScrollView>
      {isFocused && !getData && (
        <Camera
          onInit={reset}
          onBarCodeScanned={readChallenge}
          text='Scan een QR-Code om te betalen of te ontvangen.'
        />
      )}

      {!!getError && (
        <View style={globalStyles.main}>
          <Text style={globalStyles.errorText}>{getError}</Text>
        </View>
      )}

      {!!getData && (
        <View style={globalStyles.main}>
          <BigCardWithButtons
            onPressCancel={reset}
            onPressConfirm={createChallenge}
            // onPressEdit={getData.amount ? undefined : editAmount}
          >
            <Card>
              <Text style={globalStyles.property}>Contact:</Text>
              <Contact
                style={globalStyles.price}
                ledger={getData.destination}
              />
            </Card>
            <Card>
              <Text style={globalStyles.property}>Mededeling:</Text>
              <TextInput
                value={getData.message}
                onChangeText={message => setData({ ...getData, message })}
              />
            </Card>
            <Card>
              <Text style={globalStyles.property}>Transactie:</Text>
              <Text style={globalStyles.price}>
                {getSign > 0 && '… betaalt aan jou …'}
                {!getSign && '–'}
                {getSign < 0 && '… ontvangt van jou …'}
              </Text>
            </Card>
            <Card>
              <Text style={globalStyles.property}>Bedrag:</Text>
              <Text style={globalStyles.price}>
                <TextInput
                  value={getData.amount || 0}
                  onChangeText={amount => setData({ ...getData, amount })}
                />
              </Text>
            </Card>
          </BigCardWithButtons>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 40
  }
})
