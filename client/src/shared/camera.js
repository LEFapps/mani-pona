import React, { useState, useEffect } from 'react'
import log from 'loglevel'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { View, Text } from 'react-native'
import QrScanner from 'react-qr-scanner'
import { globalStyles } from '../styles/global'

import IconButton from '../shared/buttons/iconButton'

let cameraLoaded = 'false'

export default function Cam (props) {
  const [hasPermission, setHasPermission] = useState(null)
  const [camIndex, setCamIndex] = useState(0)
  const [availableCameras, setAvailableCameras] = useState([])
  const maxIndex = availableCameras.length - 1

  useEffect(() => {
    cameraLoaded = 'true'
  })

  useEffect(() => {
    if (navigator) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
          const videoSelect = []
          devices.forEach(device => {
            if (device.kind === 'videoinput') videoSelect.push(device)
          })
          return videoSelect
        })
        .then(setAvailableCameras)
        .catch(console.error)
    }
  })

  const handleBarCodeScanned = barcode => {
    // barcode in the general format: "loreco://<action>/<param 1>/<param 2>?/..."
    log.debug('QrScanner/onScan:', barcode)
    if (barcode) props.onBarCodeScanned(barcode)
  }

  const handleBarCodeError = err => {
    if (err === 'Permission denied') setHasPermission(false) // Check for correct err msg (NotAllowedError)
    console.error('QrScanner ERROR:', err)
  }

  if (hasPermission === false) return <Text>No access to camera</Text>

  const getCamId = () => availableCameras[Math.min(maxIndex, camIndex)].deviceId

  return (
    <View>
      {availableCameras.length > 1 && (
        <View style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 80 }}>
          <IconButton
            onPress={() =>
              setCamIndex(camIndex + 1 > maxIndex ? 0 : camIndex + 1)
            }
            iconName={'switch-camera'}
            iconColor={'#FFF'}
          />
        </View>
      )}
      {!!availableCameras.length && (
        <View style={globalStyles.screen}>
          <View style={globalStyles.camPlace}>
            <QrScanner
              chooseDeviceId={getCamId}
              onLoad={props.onInit}
              delay={100}
              onError={handleBarCodeError}
              onScan={handleBarCodeScanned}
              style={cameraStyle}
              key={cameraLoaded && getCamId()}
            >
              <Text>Requesting for camera permission</Text>
            </QrScanner>
          </View>

          <View style={globalStyles.qrTextContainer}>
            <Text style={globalStyles.qrText}>{props.text}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const cameraStyle = {
  maxHeight: '60vh',
  objectFit: 'fill'
}
