import React, { useState } from 'react'
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  Button,
  ScrollView
} from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import Modal from 'modal-react-native-web'
import log from 'loglevel'

import CustomButton from '../../shared/buttons/button'
import Camera from '../../shared/camera'

import { globalStyles } from '../../styles/global'
import { resetClient } from '../../../App'

const KeyTabs = createMaterialTopTabNavigator()

const ImportModal = ({ onValue, isOpen, setOpen }) => {
  const QrData = index => ({ navigation, route = {} }) => {
    const [modalStep, setStep] = useState()
    const { prevScan = '' } = route.params || {}

    const readBarcode = (data = 'loreco://null') => {
      log.debug('scanned data', data)
      const [action, ...params] = data
        .split('://')
        .pop()
        .split('/')
      log.debug('scanned action', action)
      if (action === 'import') {
        const scanned = params.join('/')
        // https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react
        if (index)
          setStep(() => () => onValue([prevScan, scanned].join('\n\n')))
        else
          setStep(() => () =>
            navigation.navigate('QR-code 2', { prevScan: scanned })
          )
      }
    }
    return (
      <View
        style={{
          backgroundColor: 'white',
          paddingVertical: 16,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {modalStep ? (
          <CustomButton text={'Volgende stap ››'} onPress={modalStep} />
        ) : (
          navigation.isFocused() && (
            <Camera
              // onInit={reset}
              onBarCodeScanned={readBarcode}
              text={`Scan QR-code ${index +
                1} met jouw persoonlijke geheime sleutels.`}
            />
          )
        )}
      </View>
    )
  }

  const TextData = () => {
    const [modalStep, setStep] = useState()
    return (
      <View
        style={{
          backgroundColor: 'white',
          paddingVertical: 16,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Text style={globalStyles.text}>Plak hieronder jouw sleutels.</Text>
        {modalStep ? (
          <CustomButton
            text={'Volgende stap ››'}
            style={{ marginTop: -10 }}
            onPress={modalStep}
          />
        ) : (
          <TextInput
            onChangeText={data => setStep(() => onValue(data))}
            // value={textData}
            style={{
              width: '100%',
              height: '50vh',
              marginTop: '16px',
              marginBottom: '16px'
            }}
            placeholder={'Plak hier je persoonlijke sleutels'}
            multiline
          />
        )}
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Modal visible={!!isOpen} transparent ariaHideApp={false}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={globalStyles.bigText}>
              Importeer jouw geheime sleutels…
            </Text>
            <KeyTabs.Navigator
              style={{
                width: '80vw',
                flex: '0 0 90vw'
              }}
            >
              <KeyTabs.Screen name={'QR-code 1'} component={QrData(0)} />
              <KeyTabs.Screen name={'QR-code 2'} component={QrData(1)} />
              <KeyTabs.Screen name={'Plakken'} component={TextData} />
            </KeyTabs.Navigator>
            <Button
              title={'Sluiten'}
              style={{ marginTop: 10, marginHorizontal: 16 }}
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </NavigationContainer>
  )
}

export const KeyPrompt = ({ onResolve, ...props }) => {
  const { maniClient } = global

  const [showPrompt, setPrompt] = useState(false)
  const [getValue, setValue] = useState('')

  const setKeys = async () => {
    maniClient
      .importKeys(getValue)
      .then(async keys => {
        if (keys) {
          // re-init maniCLient with new keys
          await resetClient()
          onResolve(getValue ? 'pasted' : global.maniClient.id)
        }
      })
      .catch(e => {
        console.error(e)
        setValue('')
      })
  }

  return (
    <ScrollView style={globalStyles.container}>
      <View style={globalStyles.main}>
        <Text style={globalStyles.bigText}>Welkom bij LoREco!</Text>
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Je bent hier in deze browser of op dit toestel voor het eerst.
          </Text>
        </View>
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Heb je nog geen account? Ga dan verder als nieuwe gebruiker.
          </Text>
        </View>
        <CustomButton
          text={'Doorgaan als nieuwe gebruiker'}
          onPress={setKeys}
          style={{ margin: '1em 0' }}
          disabled={!!getValue}
        />
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.text}>
            Heb je op een ander toestel een account aangemaakt? Importeer dan
            eerst je persoonlijke sleutels die je op je accountpagina kan
            opvragen:
          </Text>
          <CustomButton
            text={getValue ? 'Opnieuw importeren' : 'Sleutels importeren'}
            onPress={() => setPrompt(true)}
            style={{
              marginTop: '16px',
              marginBottom: '16px'
            }}
          />
          {showPrompt && (
            <ImportModal
              onValue={keys => {
                setValue(keys)
                setPrompt(false)
              }}
              isOpen={showPrompt}
              setOpen={setPrompt}
            />
          )}
        </View>
        {getValue && (
          <CustomButton
            text={'Sleutels gebruiken'}
            onPress={setKeys}
            style={{
              marginTop: '16px',
              marginBottom: '16px'
            }}
          />
        )}
      </View>
    </ScrollView>
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

export default KeyPrompt
