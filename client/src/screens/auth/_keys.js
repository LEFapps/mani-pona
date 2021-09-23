import React, { useState } from 'react'
import {
  Button,
  TextInput,
  Text,
  View,
  StyleSheet,
  Dimensions
} from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import Modal from 'modal-react-native-web'
import QRCode from 'react-native-qrcode-svg'

import CustomButton from '../../shared/buttons/button'
import { globalStyles } from '../../styles/global'

const KeyTabs = createMaterialTopTabNavigator()

const ModalContent = ({ data }) => {
  if (!data) return null

  const QrData = index => () => (
    <View
      style={{
        backgroundColor: 'white',
        paddingVertical: 16,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Text style={globalStyles.text}>
        Toon deze QR-code aan niemand anders, het zijn jouw persoonlijke geheime
        sleutels.
      </Text>
      <View style={styles.qr}>
        <QRCode
          value={'loreco:import/' + (index < 0 ? data.join('/') : data[index])}
          size={320}
          style={{ maxWidth: '80vw' }}
        />
      </View>
    </View>
  )

  const TextData = () => (
    <View
      style={{
        backgroundColor: 'white',
        paddingVertical: 16,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Text style={globalStyles.text}>
        Kopieer onderstaande sleutels naar een veilige plek. Je hebt ze nodig om
        correct te kunnen aanmelden op een ander toestel of wanneer een andere
        gebruiker dit toestel gebruikt heeft.
      </Text>
      <TextInput
        value={data.join('\n\n')}
        style={{
          width: '100%',
          height: '40vh',
          marginVertical: 20,
          textAlign: 'center'
        }}
        multiline
        editable={false}
      />
    </View>
  )

  return (
    <KeyTabs.Navigator
      style={{
        width: '80vw',
        flex: '0 0 90vw'
      }}
    >
      <KeyTabs.Screen name={'QR-code 1'} component={QrData(0)} />
      <KeyTabs.Screen name={'QR-code 2'} component={QrData(1)} />
      <KeyTabs.Screen name={'Kopiëren'} component={TextData} />
    </KeyTabs.Navigator>
  )
}

const ExportKeys = () => {
  const { maniClient } = global
  const [hasKeys, setKeys] = useState()
  const [isBusy, setBusy] = useState()
  const getKeys = async () => {
    setBusy(true)
    maniClient.exposeKeys().then(({ privateKeyArmored, publicKeyArmored }) => {
      setKeys([privateKeyArmored, publicKeyArmored])
      setBusy(false)
    })
  }

  return (
    <View>
      <CustomButton
        text={isBusy ? 'Sleutels verzamelen . . .' : 'Exporteer mijn sleutels'}
        onPress={getKeys}
      />
      {!!hasKeys && (
        <Modal visible transparent ariaHideApp={false}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={globalStyles.bigText}>
                Dit zijn jouw geheime sleutels!
              </Text>
              <ModalContent data={hasKeys} />
              <Button
                title={'Sluiten'}
                style={{ marginTop: 10 }}
                onPress={() => setKeys()}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: '8%',
    backgroundColor: 'white'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    textAlign: 'center'
  },
  qr: {
    marginBottom: 30,
    marginTop: 30,
    display: 'flex',
    alignItems: 'center'
  }
})

export default ExportKeys
