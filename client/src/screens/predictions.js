import React, { useState } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global.js'
import { Picker } from '@react-native-picker/picker'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
import Card from '../shared/card.js'
const { CurrencyColor } = colors

const monthStrings = [
  'Januari',
  'Februari',
  'Maart',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Augustus',
  'September',
  'Oktober',
  'November',
  'December'
]

export default function Predictions ({ route }) {
  const { demurrage, date, balance } = route.params
  const buffer = mani(route.params.buffer)
  const income = mani(route.params.income)

  const start = new Date().getMonth() + 1
  const startYear = new Date().getFullYear()
  let prev = balance
  const predictions = monthStrings.map((m, i) => {
    const base = prev.subtract(buffer)
    const demued = base.multiply(1 - demurrage / 100)
    prev = demued.add(income).add(buffer)
    const month = start + i > 11 ? start + i - 12 : start + i
    return { month: monthStrings[month], value: prev, i }
  })

  return (
    <ScrollView style={globalStyles.main}>
      <Card>
        <View style={{ flexDirection: 'column' }}>
          <Text style={globalStyles.property}>Huidige rekeningstand</Text>
          <Text style={globalStyles.date}>
            {new Date(date).toLocaleString()}
          </Text>
        </View>
        <Text style={globalStyles.price}>{balance.format()}</Text>
      </Card>
      <View style={{ marginTop: 16 }}>
        <Text style={globalStyles.text}>Voorspelde rekeningstand voor …</Text>
      </View>
      {predictions.map(({ month, value, i }) => (
        <Card key={month}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={globalStyles.property}>
              {month} {startYear + (i >= 12 - start ? 1 : 0)}
            </Text>
            <Text style={globalStyles.date}>
              {!income.zero() && `inkomen: ${income.format()}`}
              {!income.zero() && !!demurrage && '|'}
              {!!demurrage && `demurrage ${demurrage} %`}
            </Text>
          </View>
          <Text style={globalStyles.price}>{value.format()}</Text>
        </Card>
      ))}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
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
