import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import CustomButton from '../shared/buttons/button'
import { globalStyles } from '../styles/global.js'
import ManiClient from '../mani'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
const { DarkerBlue, CurrencyColor } = colors

export default function AccountBalance ({ navigation }) {
  const [demu, setDemu] = useState({})
  const [income, setIncome] = useState({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.systemConfiguration.demurage().then(demurage => {
      setDemu(demurage)
    })
    await ManiClient.systemConfiguration
      .incomePrediction()
      .then(incomePrediction => {
        setIncome(incomePrediction)
      })
    setReady(true)
  }

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <View style={globalStyles.amountHeader}>
          <Text style={globalStyles.property}>Huidige rekeningstand:</Text>
          <Text style={globalStyles.price}>
            {mani(ManiClient.balance).format()}
          </Text>
        </View>

        <View style={styles.part}>
          <Text style={styles.title}>Voorspellingen gegarandeerd inkomen</Text>
          <Text style={styles.amount}>
            +{mani(income.currentPrediction).format()}
          </Text>
          <CustomButton
            text='Bekijk voorspelling'
            onPress={() => navigation.navigate('IncomePrediction', income)}
          />
        </View>
        <View style={styles.part}>
          <Text style={styles.title}>Voorspellingen bijdrage</Text>
          <Text style={styles.amount}>{mani(demu.totalDemurage).format()}</Text>
          <CustomButton
            text='Bekijk voorspelling'
            onPress={() => navigation.navigate('ContributionPrediction', demu)}
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
