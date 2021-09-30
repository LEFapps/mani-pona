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
  const { income, demurrage, current } = route.params

  const buffer = 5 // TODO: get from user or type
  const start = new Date().getMonth() + 1
  let prev = current.balance
  const predictions = monthStrings.map((m, i) => {
    const base = prev.subtract(buffer)
    const demued = base.multiply(1 - demurrage / 100)
    prev = demued.add(income).add(buffer)
    const month = start + i > 11 ? start + i - 12 : start + i
    return { month: monthStrings[month], value: prev }
  })

  return (
    <ScrollView style={globalStyles.main}>
      <Card>
        <View style={{ flexDirection: 'column' }}>
          <Text style={globalStyles.property}>Huidige rekeningstand</Text>
          <Text style={globalStyles.date}>
            {new Date(current.date).toLocaleString()}
          </Text>
        </View>
        <Text style={globalStyles.price}>{current.balance.format()}</Text>
      </Card>
      {predictions.map(({ month, value }) => (
        <Card key={month}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={globalStyles.property}>{month}</Text>
            <Text style={globalStyles.date}>
              + {income.format()} | - {demurrage} %
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
