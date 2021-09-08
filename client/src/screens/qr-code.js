import React from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import { globalStyles } from '../styles/global'

import QRCode from 'react-native-qrcode-svg'
import ManiError from '../helpers/error'

export default function Receive () {
  const maniClient1 = global.maniClient

  let peerId =
    'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C226'

  maniClient1.transactions
    .current()
    .then(confirmation => {
      Alert.alert(confirmation.message + ': ' + confirmation.amount)
      // confirm the payment using the callback provided in the confirmation
    })
    .catch(error => {
      // e.g. time-outs, cancels, etc
      const maniError = new ManiError(error)
      Alert.alert(maniError.message)
    })

  return (
    <View style={globalStyles.main}>
      <View style={styles.cont}>
        <View style={styles.qr}>
          <QRCode
            value={peerId}
            size={300}
            color='black'
            backgroundColor='white'
          />
        </View>
        <Text style={globalStyles.bigText}>
          Toon deze QR-Code om te ontvangen of betalen.
        </Text>
      </View>
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
