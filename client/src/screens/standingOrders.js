import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Alert } from 'react-native'
import Card from '../shared/bigCardWithDeleteAndEdit'
import IconButton from '../shared/buttons/iconButton'
import { globalStyles } from '../styles/global'
import mani from '../../shared/mani'

export default function StandingOrder ({ navigation }) {
  const [standingOrders, setOrders] = useState([])
  const [contacts, setContacts] = useState([])
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.transactions.pending().then(standingOrders => {
      setOrders(standingOrders)
    })
    // await ManiClient.contacts.all().then(contacts => {
    //   setContacts(contacts)
    // })
    setReady(true)
  }

  function getContact (contactId) {
    const contact = contacts[contactId]
    if (contact) {
      return contact.name
    } else {
      return 'Anoniem'
    }
  }

  const deleteStandingOrder = order => {
    Alert.alert('Niet Geimplementeerd')
  }

  const editStandingOrder = order => {
    navigation.navigate('EditStandingOrder', order)
  }

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <IconButton
          iconName='add'
          iconColor='white'
          onPress={() => navigation.push('CamToAddStandingOrder')}
        />
        <FlatList
          style={{ marginTop: 5 }}
          data={standingOrders}
          keyExtractor={item => item.standingOrderId.toString()}
          renderItem={({ item }) => (
            <Card
              onPressDelete={() => deleteStandingOrder(item)}
              onPressEdit={() => editStandingOrder(item)}
            >
              <View style={{ flexDirection: 'row' }}>
                <View style={globalStyles.cardPropertys}>
                  <Text style={globalStyles.cardPropertyText}>
                    Begunstigde:
                  </Text>
                  <Text style={globalStyles.cardPropertyText}>Bedrag:</Text>
                  <Text style={globalStyles.cardPropertyText}>Einddatum:</Text>
                  <Text style={globalStyles.cardPropertyText}>Frequentie:</Text>
                  <Text style={globalStyles.cardPropertyText}>Mededeling:</Text>
                </View>
                <View style={globalStyles.cardValues}>
                  {/* <Text style={globalStyles.cardValueText}>
                    {getContact(item.contactId)}
                  </Text> */}
                  <Text style={globalStyles.cardValueText}>
                    {mani(item.amount).format()}
                  </Text>
                  <Text style={globalStyles.cardValueText}>
                    {new Date(item.endDate).toLocaleDateString()}
                  </Text>
                  <Text style={globalStyles.cardValueText}>
                    {item.frequency}
                  </Text>
                  <Text style={globalStyles.cardValueText}>{item.msg}</Text>
                </View>
              </View>
            </Card>
          )}
        />
      </View>
    )
  } else {
    return null
  }
}
