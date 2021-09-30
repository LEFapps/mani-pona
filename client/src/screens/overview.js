import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'
import CustomButton from '../shared/buttons/button'
import { globalStyles } from '../styles/global.js'
import Alert from '../shared/alert'
import { colors } from '../helpers/helper'
const { DarkerBlue, CurrencyColor } = colors

export default function AccountBalance ({ navigation }) {
  const [demurrage, setDemurrage] = useState({})
  const [income, setIncome] = useState({})
  const [current, setCurrent] = useState({})
  const [ready, setReady] = useState(false)
  const { maniClient } = global

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await maniClient
      .find(maniClient.id)
      .then(async found => {
        // console.log('Ledger registered:', !!found)
        if (!found) {
          // autoRegister
          return await Auth.currentSession()
            .then(async data => {
              const {
                email,
                'custom:alias': alias,
                'custom:ledger': ledger
              } = data.idToken.payload
              await maniClient.register(alias || email)
              loadData()
            })
            .catch(e => {
              console.error('loadData/auth', e)
              e && Alert.alert(e.message)
            })
        }
        await maniClient.transactions
          .current()
          .then(setCurrent)
          .catch(e => {
            console.error('loadData/current', e)
            e && Alert.alert(e.message)
          })
        await maniClient.system
          .parameters()
          .then(({ demurrage, income }) => {
            setDemurrage(demurrage) // int %
            setIncome(income) // mani
          })
          .catch(e => {
            console.error('loadData/params', e)
            e && Alert.alert(e.message)
          })
        setReady(true)
      })
      .catch(e => {
        console.error('loadData/find', e)
        e && Alert.alert(e.message)
      })
  }

  if (ready) {
    return (
      <ScrollView style={globalStyles.main}>
        <View style={globalStyles.amountHeader}>
          <Text style={globalStyles.property}>Huidige rekeningstand:</Text>
          <Text style={globalStyles.price}>
            {!!current.balance && current.balance.format()}
          </Text>
        </View>

        <View style={styles.part}>
          <Text style={styles.title}>Voorspellingen gegarandeerd inkomen</Text>
          <Text style={styles.amount}>+{income.format()}</Text>
          <Text style={styles.title}>Voorspellingen bijdrage</Text>
          <Text style={styles.amount}>{demurrage} %</Text>
          <CustomButton
            text='Bekijk voorspellingen'
            onPress={() =>
              navigation.navigate('Bijdragen', {
                screen: 'Predictions',
                params: { demurrage, income, current }
              })
            }
          />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}

const styles = StyleSheet.create({
  part: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkerBlue
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    color: CurrencyColor
  }
})
