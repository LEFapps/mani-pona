import React from 'react'
import { Alert } from 'react-native'
import Transaction from '../shared/transaction'
import ManiClient from '../mani'
import ManiError from '../helpers/error'

export default function TransactionFromContact ({ route, navigation }) {
  const { contactId, peerId } = route.params

  async function cancelTransaction () {
    Alert.alert('Transactie geannuleerd')
    navigation.navigate('ContactList')
  }

  async function doTransaction (values, actions) {
    navigation.navigate('ContactList')

    await ManiClient.transactions
      .create({
        amount: parseInt(values.amount), // if the objective is to send money, simply provide a negative number here
        peerId: peerId,
        msg: values.msg
      })
      .then(notification => {
        Alert.alert(
          notification.message,
          notification.message + ': ' + MANI(notification.amount).format()
        )
        actions.resetForm()
        // notification of success
      })
      .catch(error => {
        const maniError = new ManiError(error)
        Alert.alert('Transactie error', maniError.message)
        // e.g. time-outs, declined, etc
      })
  }

  async function transaction (values, actions) {
    if (values.amount < 0) {
      Alert.alert(
        'Transactie Bevestigen',
        'Er zal ' +
          MANI(values.amount).format() +
          ' van uw rekening gaan, Bent u zeker?',
        [
          {
            text: 'ANNULEER',
            onPress: () => cancelTransaction()
          },
          {
            text: 'OK',
            onPress: () => doTransaction(values, actions)
          }
        ]
      )
    } else {
      doTransaction(values, actions)
    }
  }

  return (
    <Transaction onSubmit={(values, actions) => transaction(values, actions)} />
  )
}
