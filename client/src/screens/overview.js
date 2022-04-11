import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import CustomButton from '../shared/buttons/button'
import Tooltip from '../shared/tooltip'
import { globalStyles } from '../styles/global.js'
import Card from '../shared/card'
import { colors } from '../helpers/helper'
import mani from '../../shared/mani'
import { UserContext } from '../authenticator'
import Predictions from '../screens/predictions'
import Euros from '../screens/euros'
import { useNotifications } from '../shared/notifications'
import { useIsFocused } from '@react-navigation/core'

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
            {!!available.balance &&
              available.balance.format().replace('ɱ', '₭')}
          </Text>
          <Euros style={styles.euro} />
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
          {/* Date from query "available" is always now (incremental parameter application)
           * Last edit date hidden because one extra query ("current") for only the date is not useful
           * . users should check their history to see the latest edit instead
           */}
          {/*!!available.date && (
            <Card>
              <Text style={globalStyles.property}>Laatste wijziging</Text>
              <Text style={globalStyles.price}>
                {new Date(available.date).toLocaleString('nl-BE')}
              </Text>
            </Card>
          )*/}
          {!mani(income).zero() && (
            <Card>
              <Text>
                <Text style={globalStyles.property}>Gegarandeerd Inkomen</Text>
                <Tooltip content='Je ontvangt elke maand, zonder dat je hier iets voor moet doen, zoveel Klavers op jouw rekening om uit te geven aan wat en wie jij dat wil.' />
              </Text>
              <Text style={globalStyles.price}>{income.replace('ɱ', '₭')}</Text>
            </Card>
          )}
          {!mani(buffer).zero() && (
            <Card>
              <Text style={globalStyles.property}>Vrije buffer</Text>
              <Text style={globalStyles.price}>{buffer.replace('ɱ', '₭')}</Text>
            </Card>
          )}
          {!!demurrage && (
            <Card>
              <Text>
                <Text style={globalStyles.property}>Gemeenschapsbijdrage</Text>
                <Tooltip content='Je draagt elke maand bij om een project dat iets positiefs wil doen in Lichtervelde te ondersteunen. Je kan zelf mee beslissen welk project gekozen wordt. Meer hierover en over het project dat momenteel ondersteund wordt op Klaverslichtervelde.be.' />
              </Text>
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
  },
  euro: {
    position: 'absolute',
    right: 0,
    bottom: 0
  }
})
