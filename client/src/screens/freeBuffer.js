import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Alert } from 'react-native'
import { globalStyles } from '../styles/global'
import IconButton from '../shared/buttons/iconButton'
import Card from '../shared/bigCardWithDeleteAndEdit'
import ManiClient from '../mani'
import mani from '../../shared/mani'

export default function FreeBuffer ({ navigation }) {
  const [issuedBuffers, setBuffers] = useState([])
  const [contacts, setContacts] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.issuedBuffers.all().then(issuedBuffers => {
      setBuffers(issuedBuffers)
    })
    await ManiClient.contacts.all().then(contacts => {
      setContacts(contacts)
    })
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

  const deleteFreeBuffer = freeBuffer => {
    Alert.alert('Niet Geimplementeerd')
  }

  const editFreeBuffer = freeBuffer => {
    navigation.navigate('EditIssuedBuffer', freeBuffer)
  }

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <View style={globalStyles.amountHeader}>
          <Text style={globalStyles.property}>Beschikbare vrije buffer:</Text>
          <Text style={globalStyles.price}>
            {mani(ManiClient.balance).format()}
          </Text>
        </View>
        <IconButton
          iconName='add'
          iconColor='white'
          onPress={() => navigation.push('CamToAddIssuedBuffer')}
        />
        <FlatList
          keyExtractor={item => item.issuedBufferId.toString()}
          style={{ marginTop: 5 }}
          data={issuedBuffers}
          renderItem={({ item }) => (
            <Card
              onPressDelete={() => deleteFreeBuffer(item)}
              onPressEdit={() => editFreeBuffer(item)}
            >
              <View style={{ flexDirection: 'row' }}>
                <View style={globalStyles.cardPropertys}>
                  <Text style={globalStyles.cardPropertyText}>
                    Begunstigde:
                  </Text>
                  <Text style={globalStyles.cardPropertyText}>Bedrag:</Text>
                  <Text style={globalStyles.cardPropertyText}>Einddatum:</Text>
                </View>
                <View style={globalStyles.cardValues}>
                  <Text style={globalStyles.cardValueText}>
                    {getContact(item.contactId)}
                  </Text>
                  <Text style={globalStyles.cardValueText}>
                    {mani(item.amount).format()}
                  </Text>
                  <Text style={globalStyles.cardValueText}>
                    {new Date(item.endDate).toLocaleDateString()}
                  </Text>
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
