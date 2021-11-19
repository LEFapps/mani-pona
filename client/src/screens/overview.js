import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import CustomButton from '../shared/buttons/button'
import { globalStyles } from '../styles/global.js'
import Card from '../shared/card'
import { colors } from '../helpers/helper'
import mani from '../../shared/mani'
import { UserContext } from '../authenticator'
import Predictions from '../screens/predictions'
import { useNotifications } from '../shared/notifications'
import { useIsFocused } from '@react-navigation/core'
import { HelpTip } from '../shared/helptip'

const { DarkerBlue, CurrencyColor } = colors

export default function AccountBalance ({ navigation }) {
  const user = useContext(UserContext)
  const notification = useNotifications()
  const isFocused = useIsFocused()

  const [params, setParams] = useState({})
  const [available, setAvailable] = useState({})
  const [ready, setReady] = useState(false)
  const { maniClient } = global

  const [showPredictions, setShowPredictions] = useState(false)

  useEffect(() => {
    loadData()
  }, [isFocused])

  // TODO: cleanup
  async function loadData () {
    await maniClient
      .find(maniClient.id)
      .then(async found => {
        await maniClient.transactions
          .available()
          .then(setAvailable)
          .catch(e => {
            console.error('loadData/available', e)
            notification.add({
              type: 'warning',
              message: e && e.message,
              title: 'loadData/available'
            })
          })
        await maniClient.system
          .accountTypes()
          .then(types => {
            const { demurrage, income, buffer } = types.find(
              ({ type }) =>
                type === (user.attributes['custom:type'] || 'default')
            )
            setParams({ demurrage, income, buffer })
          })
          .catch(e => {
            console.error('loadData/params', e)
            notification.add({
              type: 'warning',
              message: e && e.message,
              title: 'loadData/params'
            })
          })
        setReady(true)
      })
      .catch(e => {
        console.error('loadData/find', e)
        notification.add({
          type: 'warning',
          message: e && e.message,
          title: 'loadData/find'
        })
      })
  }

  const { income, buffer, demurrage } = params || {}

  if (ready) {
    return (
      <ScrollView style={globalStyles.main}>
        <View style={styles.part}>
          <Text style={styles.title}>Huidige rekeningstand</Text>
          <Text style={styles.amount}>
            {!!available.balance && available.balance.format()}
          </Text>
        </View>

        <View style={styles.part}>
          <CustomButton
            text='Scan een QR-code'
            onPress={() => navigation.navigate('Scan')}
          />
          <CustomButton
            text='Maak een QR-code'
            onPress={() => navigation.navigate('Create')}
          />
        </View>
        <View style={styles.part}>
          {!!available.date && (
            <Card>
              <Text style={globalStyles.property}>Laatste wijziging</Text>
              <Text style={globalStyles.price}>
                {new Date(available.date).toLocaleString('nl-BE')}
              </Text>
            </Card>
          )}
          {!mani(income).zero() && (
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <Text style={globalStyles.property}>Inkomen</Text>
                <HelpTip>
                  <Text>
                    Dit bedrag wordt maandelijks bij uw rekeningstand geteld.
                  </Text>
                </HelpTip>
              </View>
              <Text style={globalStyles.price}>{income}</Text>
            </Card>
          )}
          {!mani(buffer).zero() && (
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <Text style={globalStyles.property}>Vrije buffer</Text>
                <HelpTip>
                  <Text>
                    Op dit bedrag wordt geen gemeenschapsbijdrage berekend.
                  </Text>
                </HelpTip>
              </View>
              <Text style={globalStyles.price}>{buffer}</Text>
            </Card>
          )}
          {!!demurrage && (
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <Text style={globalStyles.property}>Gemeenschapsbijdrage</Text>
                <HelpTip>
                  <Text>Dit bedrag wordt van uw rekeningstand afgenomen.</Text>
                </HelpTip>
              </View>
              <Text style={globalStyles.price}>{demurrage} %</Text>
            </Card>
          )}
          <CustomButton
            text={`${!showPredictions ? 'Bekijk' : 'Verberg'} voorspellingen`}
            // onPress={() => navigation.navigate('Predictions')}
            onPress={() => {
              setShowPredictions(!showPredictions)
            }}
          />
          {!!showPredictions && (
            <View>
              <Predictions />
            </View>
          )}
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}

const styles = StyleSheet.create({
  part: {
    paddingVertical: 24,
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
