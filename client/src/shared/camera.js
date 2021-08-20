import React, { useState, useEffect } from 'react'

import { View, Text, StyleSheet } from 'react-native'
import { Camera } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'
import Button from '../shared/buttons/largeRoundTextButton'
import { globalStyles } from '../styles/global'

export default function Cam (props) {
  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    props.onBarCodeScanned(type, data)
  }

  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    const requestPermission = async () => {
      if (BarCodeScanner && (await BarCodeScanner.isAvailableAsync())) {
        const { status } = await BarCodeScanner.requestPermissionsAsync()
        setHasPermission(status === 'granted')
      } else {
        setHasPermission(true)
      }
    }
    requestPermission()
  }, [])

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  } else {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.camPlace}>
          <Camera
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            ratio='16:9'
            style={StyleSheet.absoluteFill}
          />
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
}
