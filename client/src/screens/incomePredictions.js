import React, { useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { globalStyles } from '../styles/global.js'
import { Picker } from '@react-native-picker/picker'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
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

export default function incomePrediction ({ route }) {
  const { currentPrediction, predictions } = route.params
  const currentYear = new Date().getYear()
  const currentMonth = new Date().getMonth()
  const [income, setIncome] = useState(currentPrediction)
  const [month, setMonth] = useState(currentMonth)

  function changeValue (itemIndex) {
    setIncome(predictions[itemIndex].income)
  }

  return (
    <View style={globalStyles.main}>
      <View style={globalStyles.amountHeader}>
        <Text style={globalStyles.property}>Voorspelling huidige maand:</Text>
        <Text style={globalStyles.price}>{currentPrediction.format()}</Text>
      </View>
      <Text style={globalStyles.label}>Selecteer maand</Text>
      <View>
        <View style={globalStyles.input}>
          <Picker
            selectedValue={monthStrings[month]}
            onValueChange={itemValue => {
              changeValue(Number(itemValue))
              setMonth(itemValue)
            }}
          >
            {monthStrings.slice(currentMonth).map((label, index) => (
              <Picker.Item
                label={`${label} ${currentYear}`}
                value={index}
                key={label}
              />
            ))}
            {currentMonth &&
              monthStrings
                .slice(0, currentMonth)
                .map((label, index) => (
                  <Picker.Item
                    label={`${label} ${currentYear + 1}`}
                    value={index}
                    key={label}
                  />
                ))}
          </Picker>
        </View>

        <View>
          <Text style={styles.title}>
            Voorspeld inkomen voor {monthStrings[month]}
          </Text>
          <Text style={styles.amount}>+ {income.format()}</Text>
        </View>
      </View>
    </View>
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
