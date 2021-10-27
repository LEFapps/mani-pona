import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global.js'
import mani from '../../shared/mani'
import Alert from '../shared/alert'
import { colors } from '../helpers/helper'
import Card from '../shared/card.js'
import { useIsFocused } from '@react-navigation/core'
import { UserContext } from '../authenticator'
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

export default function Predictions () {
  const { maniClient } = global
  const user = useContext(UserContext)

  const isFocused = useIsFocused()

  const [params, setParams] = useState({})
  const [current, setCurrent] = useState({})

  const [predictions, setPredictions] = useState([])
  const [isReady, setReady] = useState()

  const start = new Date().getMonth() + 1
  const startYear = new Date().getFullYear()
  const { date, balance } = current
  const { demurrage } = params || {}
  const buffer = !!params.buffer ? mani(params.buffer) : mani(0)
  const income = !!params.income ? mani(params.income) : mani(0)

  useEffect(() => {
    const loadParams = async () => {
      await maniClient.transactions
        .current()
        .then(setCurrent)
        .catch(e => {
          console.error('loadData/current', e)
          e && Alert.alert(e.message)
        })
      await maniClient.system
        .accountTypes()
        .then(types => {
          const { demurrage, income, buffer } = types.find(
            ({ type }) => type === (user.attributes['custom:type'] || 'default')
          )
          setParams({ demurrage, income, buffer })
        })
        .catch(e => {
          console.error('loadData/params', e)
          e && Alert.alert(e.message)
        })
      setReady(true)
    }
    isFocused ? loadParams() : setReady(false)
  }, [isFocused])

  useEffect(() => {
    if (isFocused && isReady) {
      let prev = balance
      const pred = monthStrings.map((m, i) => {
        const diff = prev.subtract(buffer).multiply(demurrage / 100)
        prev = prev.subtract(diff).add(income)
        const month = start + i > 11 ? start + i - 12 : start + i
        return { month: monthStrings[month], value: prev, i }
      })
      setPredictions(pred)
    }
  }, [isReady, isFocused])

  return (
    <ScrollView style={globalStyles.main}>
      <Card>
        <View style={{ flexDirection: 'column' }}>
          <Text style={globalStyles.property}>Huidige rekeningstand</Text>
          <Text style={globalStyles.date}>
            {new Date(date).toLocaleString()}
          </Text>
        </View>
        <Text style={globalStyles.price}>{balance && balance.format()}</Text>
      </Card>
      <View style={{ marginTop: 16 }}>
        <Text style={globalStyles.text}>Voorspelde rekeningstand voor …</Text>
      </View>
      {isReady &&
        predictions.map(({ month, value, i }) => (
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
