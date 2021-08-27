import React, { useState, useEffect } from 'react'

import { View, Text, StyleSheet } from 'react-native'
import QrScanner from 'react-qr-scanner'
import Button from '../shared/buttons/largeRoundTextButton'
import { globalStyles } from '../styles/global'

export default function Cam (props) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)

  const handleBarCodeScanned = barcode => {
    console.log(barcode)
    const { type, data } = barcode || {}
    setScanned(true)
    // setScanned(barcode !== null)
    props.onBarCodeScanned(type, data)
  }

  const handleBarCodeError = err => {
    if (err === 'Permission denied') setHasPermission(false) // Check for correct err msg (NotAllowedError)
    console.error('QrScanner ERROR:', err)
  }
  if (hasPermission === false) return <Text>No access to camera</Text>
  return (
    <View style={globalStyles.screen}>
      <View style={globalStyles.camPlace}>
        <QrScanner
          // legacyMode
          interval={500}
          // style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          // style={globalStyles.qrTextContainer}
          onError={handleBarCodeError}
          onScan={scanned ? undefined : handleBarCodeScanned}
        >
          <Text>Requesting for camera permission</Text>
        </QrScanner>
        {scanned && (
          <Button
            text={'Tik om opnieuw te scannen'}
            onPress={() => setScanned(false)}
          />
        )}
      </View>

      <View style={globalStyles.qrTextContainer}>
        <Text style={globalStyles.qrText}>{props.text}</Text>
      </View>
    </View>
  )
}
