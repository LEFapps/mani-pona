import React, { useState } from 'react'
import { View, StyleSheet, Dimensions, Text } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import RoundButton from '../shared/buttons/roundIconButton'
import BigCardWithButtons from '../shared/bigCardWithButtons'
import Camera from '../shared/camera'
import MANI from '../../shared/mani'

import { globalStyles } from '../styles/global'
import { getErrorSource } from 'source-map-support'

export default function Home ({ navigation }) {
  const isFocused = useIsFocused()
  const [getData, setData] = useState()
  const [getError, setError] = useState([])
  const reset = () => {
    setData()
    setError()
  }
  const maniClient = global.maniClient

  const readChallenge = (data = 'loreco:null') => {
    const [action, ...params] = data
      .split(':')
      .pop()
      .split('/')
    if (action === 'scan') {
      const [destination, incomingAmount] = params || []
      const amount = Number(incomingAmount) / 100
      setData({ destination, amount })
    } else setData()
  }

  const createChallenge = async () => {
    setError([])
    const { destination, amount } = getData
    maniClient.transactions
      .challenge(destination, MANI(amount))
      .then(challenge => {
        console.log('PAYMENT', challenge)
        if (challenge) navigation.navigate('AccountBalance')
      })
      .catch(err => {
        setError(err.message)
      })
  }

  const editAmount = () => {
    const amount = prompt('Wijzig het bedrag')
    setData({ ...getData, amount: Number(amount) })
  }

  return (
    <View>
      {isFocused && (
        <Camera
          onInit={reset}
          onBarCodeScanned={readChallenge}
          text='Scan een QR-Code om te betalen of te ontvangen.'
        />
      )}

      {getData && (
        <BigCardWithButtons
          onPressCancel={reset}
          onPressConfirm={createChallenge}
          onPressEdit={getData.amount ? undefined : editAmount}
        >
          <View style={{ flexDirection: 'column' }}>
            <Text style={globalStyles.property}>{getData.destination}</Text>
            <Text style={globalStyles.price}>
              {!!getData.amount && MANI(getData.amount).format()}
            </Text>
            {!!getError && (
              <Text style={globalStyles.errorText}>{getError}</Text>
            )}
          </View>
        </BigCardWithButtons>
      )}

      {/* <View style={styles.buttonContainer}>
        <RoundButton
          text='QR-Code'
          logoName='credit-card'
          onPress={() => navigation.navigate('QRCode')}
        />
        <RoundButton
          text='Overzicht'
          logoName='dashboard'
          onPress={() => navigation.navigate('AccountBalance')}
        />
      </View> */}
    </View>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width,
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 40
  }
})
