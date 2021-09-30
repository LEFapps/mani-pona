import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import RoundButton from '../shared/buttons/roundIconButton'
import BigCardWithButtons from '../shared/bigCardWithButtons'
import Camera from '../shared/camera'
import MANI from '../../shared/mani'
import Card from '../shared/card'

import { globalStyles } from '../styles/global'
import { Contact } from '../shared/contact'
import log from 'loglevel'
import { TextInput } from 'react-native-paper'

export default function Home ({ navigation }) {
  const isFocused = useIsFocused()
  const [getData, setData] = useState()
  const [getError, setError] = useState([])
  const reset = () => {
    setData()
    setError()
  }
  const maniClient = global.maniClient

  const readChallenge = (data = 'loreco://null') => {
    log.debug('scanned data', data)
    const [action, ...params] = data
      .split('://')
      .pop()
      .split('/')
    log.debug('scanned action', action)
    if (action === 'scan') {
      const [destination, incomingAmount] = params || []
      log.debug('Scanned', destination, incomingAmount)
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
        // console.log('CHALLENGE', challenge)
        return maniClient.transactions.create(challenge)
      })
      .then(create => {
        // console.log('CREATE', create)
        if (create) navigation.navigate('AccountBalance')
      })
      .catch(err => {
        setError(err.message)
      })
  }

  return (
    <ScrollView>
      {isFocused && !getData && (
        <Camera
          onInit={reset}
          onBarCodeScanned={readChallenge}
          text='Scan een QR-Code om te betalen of te ontvangen.'
        />
      )}

      {!!getError && (
        <View style={globalStyles.main}>
          <Text style={globalStyles.errorText}>{getError}</Text>
        </View>
      )}

      {!!getData && (
        <View style={globalStyles.main}>
          <BigCardWithButtons
            onPressCancel={reset}
            onPressConfirm={createChallenge}
            // onPressEdit={getData.amount ? undefined : editAmount}
          >
            <Card>
              <Text style={globalStyles.property}>Contact:</Text>
              <Contact
                style={globalStyles.price}
                ledger={getData.destination}
              />
            </Card>
            {/* <Card>
              <Text style={globalStyles.property}>Mededeling:</Text>
              <Text style={globalStyles.price}>{transaction.msg}</Text>
            </Card> */}
            <Card>
              <Text style={globalStyles.property}>Transactie:</Text>
              <Text style={globalStyles.price}>
                {getData.amount > 0 && '… betaalt aan jou …'}
                {!getData.amount && '–'}
                {getData.amount < 0 && '… ontvangt van jou …'}
              </Text>
            </Card>
            <Card>
              <Text style={globalStyles.property}>Bedrag:</Text>
              <Text style={globalStyles.price}>
                <TextInput
                  value={getData.amount || 0}
                  onChangeText={amount =>
                    setData({ ...getData, amount: Number(amount) })
                  }
                />
              </Text>
            </Card>
          </BigCardWithButtons>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 40
  }
})
