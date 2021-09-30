import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'
import CustomButton from '../shared/buttons/button'
import { globalStyles } from '../styles/global.js'
import Alert from '../shared/alert'
import Card from '../shared/card'
import { colors } from '../helpers/helper'
import { UserContext } from '../authenticator'
const { DarkerBlue, CurrencyColor } = colors

export default function AccountBalance ({ navigation }) {
  const user = useContext(UserContext)

  const [params, setParams] = useState({})
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
          const { email, alias } = user
          await maniClient.register(alias || email)
          loadData()
        } else {
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
                ({ type }) => type === (user.type || 'default')
              )
              setParams({ demurrage, income, buffer })
            })
            .catch(e => {
              console.error('loadData/params', e)
              e && Alert.alert(e.message)
            })
          setReady(true)
        }
      })
      .catch(e => {
        console.error('loadData/find', e)
        e && Alert.alert(e.message)
      })
  }

  const { income, buffer, demurrage } = params || {}

  if (ready) {
    return (
      <ScrollView style={globalStyles.main}>
        <View style={styles.part}>
          <Text style={styles.title}>Huidige rekeningstand</Text>
          <Text style={styles.amount}>
            {!!current.balance && current.balance.format()}
          </Text>
        </View>

        {!!current.date && (
          <Card>
            <Text style={globalStyles.property}>Laatste wijziging</Text>
            <Text style={globalStyles.price}>
              {new Date(current.date).toLocaleString()}
            </Text>
          </Card>
        )}
        <Card>
          <Text style={globalStyles.property}>Inkomen</Text>
          <Text style={globalStyles.price}>{income}</Text>
        </Card>
        <Card>
          <Text style={globalStyles.property}>Vrije buffer</Text>
          <Text style={globalStyles.price}>{buffer}</Text>
        </Card>
        <Card>
          <Text style={globalStyles.property}>Demurrage</Text>
          <Text style={globalStyles.price}>{demurrage} %</Text>
        </Card>

        <View style={styles.part}>
          <CustomButton
            text='Bekijk voorspellingen'
            onPress={() =>
              navigation.navigate('Bijdragen', {
                screen: 'Predictions',
                params: {
                  demurrage,
                  buffer,
                  income,
                  date: current.date,
                  balance: current.balance
                }
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
