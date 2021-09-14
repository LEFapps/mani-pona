import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import CustomButton from '../shared/buttons/button'
import { globalStyles } from '../styles/global.js'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
const { DarkerBlue, CurrencyColor } = colors

export default function AccountBalance ({ navigation }) {
  const [demurrage, setDemurrage] = useState({})
  const [income, setIncome] = useState({})
  const [current, setCurrent] = useState({})
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.transactions
      .current()
      .then(setCurrent)
      .catch(console.error)
    await ManiClient.system
      .parameters()
      .then(({ demurrage, income }) => {
        setDemurrage(demurrage) // int
        setIncome(income) // mani
      })
      .catch(console.error)
    setReady(true)
  }

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <View style={globalStyles.amountHeader}>
          <Text style={globalStyles.property}>Huidige rekeningstand:</Text>
          <Text style={globalStyles.price}>{current.balance.format()}</Text>
        </View>

        <View style={styles.part}>
          <Text style={styles.title}>Voorspellingen gegarandeerd inkomen</Text>
          <Text style={styles.amount}>+{income.format()}</Text>
          <CustomButton
            text='Bekijk voorspelling'
            onPress={() =>
              navigation.navigate('Bijdragen', {
                screen: 'IncomePrediction',
                params: { income }
              })
            }
          />
        </View>
        <View style={styles.part}>
          <Text style={styles.title}>Voorspellingen bijdrage</Text>
          <Text style={styles.amount}>{mani(demurrage).format()}</Text>
          <CustomButton
            text='Bekijk voorspelling'
            onPress={() =>
              navigation.navigate('Bijdragen', {
                screen: 'ContributionPrediction',
                params: { demurrage }
              })
            }
          />
        </View>
      </View>
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
