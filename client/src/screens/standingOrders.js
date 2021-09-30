import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, ScrollView } from 'react-native'
import Card from '../shared/bigCardWithButtons'
import IconButton from '../shared/buttons/iconButton'
import { globalStyles } from '../styles/global'
import mani from '../../shared/mani'
import { Contact } from '../shared/contact'

export default function StandingOrder ({ navigation }) {
  const [standingOrders, setOrders] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.transactions
      .pending()
      .then(pending => {
        setOrders(pending ? [{ ...pending, key: 'pending' }] : [])
        setReady(true)
      })
      .catch(e => setError(e.message))
  }

  if (ready) {
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
                        ManiClient.transactions
                          .confirm(challenge)
                          .then(confirm => {
                            console.log('confirm', confirm)
                            navigation.navigate('LoREco')
                          })
                          .catch(console.error)
                }
                onPressCancel={
                  destination === 'system' || !toSign
                    ? undefined
                    : () =>
                        ManiClient.transactions
                          .cancel(challenge)
                          .then(cancel => {
                            console.log('cancel', cancel)
                            navigation.navigate('LoREco')
                          })
                          .catch(lorrconsole.error)
                }
              >
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
                      Frequentie:
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
                      {amount.format()}
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
