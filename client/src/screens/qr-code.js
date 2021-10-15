import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { globalStyles } from '../styles/global'
import FlatButton from '../shared/buttons/historyButton'
import Button from '../shared/buttons/button'

export default function Receive () {
  const [getAmount, setAmount] = useState('0')
  const [getSign, setSign] = useState(100)
  const [getConfirm, setConfirm] = useState(false)
  const [getValue, setValue] = useState('')
  const { maniClient } = global

  // maniClient.transactions
  //   .current()
  //   .then(confirmation => {
  //     Alert.alert(confirmation.message + ': ' + confirmation.amount)
  //     // confirm the payment using the callback provided in the confirmation
  //   })
  //   .catch(error => {
  //     // e.g. time-outs, cancels, etc
  //     const maniError = new ManiError(error)
  //     Alert.alert(maniError.message)
  //   })

  const createQr = () => {
    // barcode in the format: "loreco://scan/<fingerprint:destination>/<amount * 100>?"
    setValue(
      `loreco://scan/${maniClient.id}/${parseFloat(
        getAmount.replace(',', '.')
      ) * getSign}`
    )
    setConfirm(true)
  }

  const reset = () => {
    setAmount('0')
    setValue('')
    setConfirm(false)
  }

  const signOptions = [
    {
      active: () => getSign > 0,
      onPress: () => setSign(100),
      title: 'Betalen'
    },
    {
      active: () => getSign < 0,
      onPress: () => setSign(-100),
      title: 'Ontvangen'
    }
  ]

  return (
    <ScrollView style={globalStyles.main}>
      {getValue && getConfirm ? (
        <View style={styles.cont}>
          <View style={styles.qr}>
            <QRCode value={getValue} size={320} quietZone={8} />
          </View>
          <Text style={globalStyles.bigText}>
            Toon deze QR-Code om een transactie te starten.
          </Text>
          <Button text='Nieuw' onPress={reset} />
        </View>
      ) : (
        <View style={styles.cont}>
          <View>
            <Text style={globalStyles.label}>Bedrag (optioneel)</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='0,00'
              onChangeText={setAmount}
              value={getAmount}
            />
          </View>
          <View>
            <FlatButton options={signOptions} />
          </View>
          <Button text='Aanmaken' onPress={createQr} />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cont: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  qr: {
    marginBottom: 30,
    marginTop: 30
  }
})
