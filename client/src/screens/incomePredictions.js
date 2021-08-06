import React, { useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { globalStyles } from '../styles/global.js'
import { Picker } from '@react-native-picker/picker'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
const { CurrencyColor } = colors

export default function incomePrediction ({ route }) {
  const { currentPrediction, predictions } = route.params

  const [income, setIncome] = useState(currentPrediction)

  const [month, setMonth] = useState({
    monthNumber: 1,
    monthString: 'Januari'
  })

  function changeValue (itemIndex) {
    setIncome(predictions[itemIndex].income)
  }

  return (
    <View style={globalStyles.main}>
      <View style={globalStyles.amountHeader}>
        <Text style={globalStyles.property}>Voorspelling huidige maand:</Text>
        <Text style={globalStyles.price}>
          {mani(currentPrediction).format()}
        </Text>
      </View>
      <Text style={globalStyles.label}>Selecteer maand</Text>
      <View>
        <View style={globalStyles.input}>
          <Picker
            selectedValue={month.monthString}
            onValueChange={(itemValue, itemIndex) => {
              changeValue(itemIndex)
              setMonth({
                monthNumber: (itemIndex += 1),
                monthString: itemValue
              })
            }}
          >
            <Picker.Item label='Januari' value='Januari' key='1' />
            <Picker.Item label='Februari' value='Februari' key='2' />
            <Picker.Item label='Maart' value='Maart' key='3' />
            <Picker.Item label='April' value='April' key='4' />
            <Picker.Item label='Mei' value='Mei' key='5' />
            <Picker.Item label='Juni' value='Juni' key='6' />
            <Picker.Item label='Juli' value='Juli' key='7' />
            <Picker.Item label='Augustus' value='Augustus' key='8' />
            <Picker.Item label='September' value='September' key='9' />
            <Picker.Item label='Oktober' value='Oktober' key='10' />
            <Picker.Item label='November' value='November' key='11' />
            <Picker.Item label='December' value='December' key='12' />
          </Picker>
        </View>

        <View>
          <Text style={styles.title}>
            Voorspeld inkomen voor {month.monthString}
          </Text>
          <Text style={styles.amount}>+ {mani(income).format()}</Text>
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
