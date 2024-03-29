import React, { useContext, useState, useEffect } from 'react'
import { View, Text, FlatList, ScrollView } from 'react-native'
import Card from '../shared/bigCardWithButtons'
import { Contact } from '../shared/contact'
import { useNotifications } from '../shared/notifications'

import { globalStyles } from '../styles/global'

export default function StandingOrder ({ navigation }) {
  const { maniClient } = global

  const notification = useNotifications()

  const [standingOrders, setOrders] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await maniClient.transactions
      .pending()
      .then(pending => {
        setOrders(pending ? [{ ...pending, key: 'pending' }] : [])
        setReady(true)
      })
      .catch(e => {
        console.error('transactions/pending', e)
        notification.add({
          type: 'warning',
          title: 'loadData/pending',
          message: e && e.message
        })
      })
  }

  if (ready) {
    if (standingOrders && !standingOrders.length) {
      return (
        <ScrollView style={globalStyles.main}>
          <Text style={globalStyles.text}>Geen transacties om te tekenen.</Text>
        </ScrollView>
      )
    }
    return (
      <ScrollView style={globalStyles.main}>
        {/* <IconButton
          iconName='add'
          iconColor='white'
          onPress={() => navigation.push('CamToAddStandingOrder')}
        /> */}
        {error && <Text style={globalStyles.errorText}>{error}</Text>}
        <FlatList
          style={{ marginTop: 5 }}
          data={standingOrders}
          // keyExtractor={item => item.challenge.toString()}
          renderItem={({ item }) => {
            if (!item) return
            const {
              ledger,
              destination,
              amount,
              income,
              demurrage,
              balance,
              date,
              challenge,
              message,
              toSign
            } = item
            return (
              <Card
                onPressConfirm={
                  !toSign
                    ? undefined
                    : () =>
                        maniClient.transactions
                          .confirm(challenge)
                          .then(confirm => {
                            // console.log('CONFIRM', confirm)
                            navigation.navigate('Startscherm')
                          })
                          .catch(e => {
                            console.error('transaction/confirm', e)
                            notification.add({
                              type: 'warning',
                              message: e && e.message,
                              title: 'transaction/confirm'
                            })
                          })
                }
                onPressCancel={
                  destination === 'system' || !toSign
                    ? undefined
                    : () =>
                        maniClient.transactions
                          .cancel(challenge)
                          .then(cancel => {
                            // console.log('CANCEL', cancel)
                            navigation.navigate('Startscherm')
                          })
                          .catch(e => {
                            console.error('transaction/cancel', e)
                            notification.add({
                              type: 'warning',
                              message: e && e.message,
                              title: 'transaction/cancel'
                            })
                          })
                }
              >
                <Text style={globalStyles.bigText}>
                  Deze betaling wacht nog op goedkeuring.
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  <View style={globalStyles.cardPropertys}>
                    <Text style={globalStyles.cardPropertyText}>
                      Begunstigde:
                    </Text>
                    <Text style={globalStyles.cardPropertyText}>Bedrag:</Text>
                    <Text style={globalStyles.cardPropertyText}>
                      Einddatum:
                    </Text>
                    <Text style={globalStyles.cardPropertyText}>
                      Mededeling:
                    </Text>
                  </View>
                  <View style={globalStyles.cardValues}>
                    <Contact
                      style={globalStyles.cardValueText}
                      ledger={destination.toString()}
                    />
                    <Text style={globalStyles.cardValueText}>
                      {amount.format().replace('ɱ', '₭')}
                    </Text>
                    <Text style={globalStyles.cardValueText}>
                      {new Date(challenge.endDate || date).toLocaleDateString()}
                    </Text>
                    <Text style={globalStyles.cardValueText}>
                      {challenge.frequency}
                    </Text>
                    <Text style={globalStyles.cardValueText}>{message}</Text>
                  </View>
                </View>
              </Card>
            )
          }}
        />
      </ScrollView>
    )
  } else {
    return null
  }
}
