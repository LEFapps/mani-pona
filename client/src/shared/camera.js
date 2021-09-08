import React, { useState, useEffect } from 'react'

import { View, Text, StyleSheet } from 'react-native'
import QrScanner from 'react-qr-scanner'
import Button from '../shared/buttons/largeRoundTextButton'
import { globalStyles } from '../styles/global'

export default function Cam (props) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)

  const handleBarCodeScanned = barcode => {
    // barcode in the format: {text: "loreco:scan/f8aca881b6f87f9aa42708943ce067ef8334e9e8/16000", rawBytes: Uint8Array(64), numBits: 512, resultPoints: Array(4), format: 11, …}
    const { text } = barcode || {}
    props.onBarCodeScanned(text)
    // setScanned(true)
    setScanned(barcode !== null)
  }

  const handleBarCodeError = err => {
    if (err === 'Permission denied') setHasPermission(false) // Check for correct err msg (NotAllowedError)
    console.error('QrScanner ERROR:', err)
  }

  if (hasPermission === false) return <Text>No access to camera</Text>

  return (
    <View style={globalStyles.screen}>
      <View style={globalStyles.camPlace}>
        {scanned ? (
          <Button
            text={'Tik om opnieuw te scannen'}
            onPress={() => setScanned(false)}
          />
        ) : (
          <QrScanner
            // legacyMode
            // interval={5000}
            delay={false}
            // style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            // style={globalStyles.qrTextContainer}
            onError={handleBarCodeError}
            onScan={handleBarCodeScanned}
          >
            <Text>Requesting for camera permission</Text>
          </QrScanner>
        )}
      </View>

      <View style={globalStyles.qrTextContainer}>
        <Text style={globalStyles.qrText}>{props.text}</Text>
      </View>
    </View>
  )
}
