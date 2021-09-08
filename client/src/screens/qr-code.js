import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native'
import { globalStyles } from '../styles/global'
import Button from '../shared/buttons/button'

import QRCode from 'react-native-qrcode-svg'
import ManiError from '../helpers/error'

export default function Receive () {
  const [getAmount, setAmount] = useState(0)
  const [getConfirm, setConfirm] = useState(false)
  const [getValue, setValue] = useState('')
  const maniClient1 = global.maniClient

  // maniClient1.transactions
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
    setValue(`loreco:scan/${maniClient1.id}/${Number(getAmount) * 100}`)
    setConfirm(true)
  }

  const reset = () => {
    setAmount(0)
    setValue('')
    setConfirm(false)
  }

  return (
    <View style={globalStyles.main}>
      {getValue && getConfirm ? (
        <View style={styles.cont}>
          <View style={styles.qr}>
            <QRCode
              value={getValue}
              size={300}
              color='black'
              backgroundColor='white'
            />
          </View>
          <Text style={globalStyles.bigText}>
            Toon deze QR-Code om te ontvangen of betalen.
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
          <Button text='Aanmaken' onPress={createQr} />
        </View>
      )}
    </View>
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
