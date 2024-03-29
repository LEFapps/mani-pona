import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { globalStyles } from '../styles/global'
import FlatButton from '../shared/buttons/historyButton'
import Button from '../shared/buttons/button'
import { fixedEncodeURIComponent } from '../../shared/tools'

export default function Receive () {
  const { maniClient } = global

  const [getAmount, setAmount] = useState('')
  const [getMsg, setMsg] = useState('')
  const [getSign, setSign] = useState(100)
  const [getConfirm, setConfirm] = useState(false)
  const [getValue, setValue] = useState('')

  const dim = Dimensions.get('window')

  const createQr = () => {
    // barcode in the format: "loreco://scan/<fingerprint:destination>/<amount * 100>?/msg?"
    setValue(
      `loreco://scan/${maniClient.id}/${parseFloat(
        getAmount.replace(',', '.')
      ) * getSign}/${fixedEncodeURIComponent(getMsg)}`
    )
    setConfirm(true)
  }

  const reset = () => {
    setAmount('0')
    setValue('')
    setMsg('')
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
            <QRCode
              value={getValue}
              size={Math.min(480, Math.min(dim.width, dim.height)) - 64}
              quietZone={8}
            />
          </View>
          <Text style={globalStyles.bigText}>
            Toon deze QR-Code om een transactie te starten.
          </Text>
          <Button text='Terug' onPress={reset} />
        </View>
      ) : (
        <View style={styles.cont}>
          <View>
            <Text style={globalStyles.label}>Bedrag</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='0,00'
              onChangeText={setAmount}
              value={getAmount}
            />
          </View>
          <View>
            <Text style={globalStyles.label}>Mededeling (optioneel)</Text>
            <TextInput
              style={globalStyles.input}
              onChangeText={setMsg}
              value={getMsg}
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
