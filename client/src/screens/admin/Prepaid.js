import React, { useState } from 'react'
import { renderToString } from 'react-dom/server'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'

import mani from '../../../shared/mani'

import Button from '../../shared/buttons/button'
import Card from '../../shared/card'

import { globalStyles } from '../../styles/global'
import FlatButton from '../../shared/buttons/button'
import { downloader } from '../../helpers/downloader'
import { colors } from '../../helpers/helper'
import { useNotifications } from '../../shared/notifications'

export const Prepaid = ({ navigation, route }) => {
  const { maniClient } = global

  const notification = useNotifications()

  const [amount, setAmount] = useState('0')
  const [ledger, setLedger] = useState('')
  const [prepaid, setPrepaid] = useState('')
  const [isBusy, setBusy] = useState()

  const dim = Dimensions.get('window')

  const onCreate = async () => {
    if (!amount || amount <= 0) {
      notification.add({
        type: 'danger',
        title: 'Foutief startbedrag',
        message:
          'Het startbedrag van een prepaid ledger moet een waarde van meer dan 0 ɱ zijn.'
      })
      return
    }
    setBusy(true)
    await maniClient.admin
      .createPrepaidLedger(mani(amount))
      .then(ledger => {
        setLedger(ledger)
        // barcode in the format: "loreco://scan/<fingerprint:destination>/<amount * 100>?/msg?"
        setPrepaid(`loreco://scan/${ledger}/__prepaid__`)
      })
      .catch(e => {
        console.error('amdin/createPrepaidLedger', e)
        notification.add({
          type: 'danger',
          title: 'Prepaid aanmaken mislukt',
          message: e && e.message
        })
      })
  }

  const reset = () => {
    setAmount('0')
    setLedger('')
    setPrepaid('')
    setBusy(false)
  }

  const svgComp = !!prepaid && (
    <QRCode
      value={prepaid}
      size={Math.min(480, Math.min(dim.width, dim.height)) - 64}
      quietZone={8}
      color={colors.DarkerBlue}
    />
  )

  const dl = () => {
    const string =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
      renderToString(svgComp).slice(4)
    downloader(
      string,
      `Prepaid (${mani(amount).format()}) ${ledger} `,
      'image/svg+xml'
    )
  }

  return (
    <ScrollView style={globalStyles.main}>
      {!!prepaid ? (
        <View style={styles.cont}>
          <View style={styles.qr}>{svgComp}</View>
          <Text style={globalStyles.bigText}>
            Bewaar en print deze QR-code om offline te betalen.
          </Text>
          <FlatButton text='Bewaren' onPress={dl} />
          <FlatButton text='Nieuw' onPress={reset} />
        </View>
      ) : (
        <View>
          <Text style={globalStyles.label}>Bedrag</Text>
          <TextInput style={globalStyles.input} onChangeText={setAmount} />
          <FlatButton
            title={isBusy ? '• • •' : 'Prepaid account maken'}
            onPress={onCreate}
          />
        </View>
      )}
    </ScrollView>
  )
}

export default Prepaid

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
