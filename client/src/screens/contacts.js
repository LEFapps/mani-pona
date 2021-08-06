import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, Alert } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Card from '../shared/bigCardWithDeleteAndEdit'
import { globalStyles } from '../styles/global'

export default function ContactList ({ navigation }) {
  const [contacts, setContacts] = useState([])
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    ManiClient.contacts.all().then(contacts => {
      setContacts(contacts)
    })
    setReady(true)
  }

  const deleteContact = contact => {
    Alert.alert('Niet Geimplementeerd')
    //Alert.alert(contact.contactId.toString());
  }

  const editContact = contact => {
    Alert.alert('Niet Geimplementeerd')
    //Alert.alert(contact.contactId.toString());
  }

  if (ready === false) {
    return null
  } else {
    return (
      <View style={globalStyles.main}>
        <FlatList
          keyExtractor={item => item.contactId.toString()}
          style={{ marginTop: 5 }}
          data={contacts}
          renderItem={({ item }) => (
            <Card
              onPressDelete={() => deleteContact(item)}
              onPressEdit={() => editContact(item)}
            >
              <View style={{ flexDirection: 'row' }}>
                <View style={globalStyles.cardPropertys}>
                  <Text style={globalStyles.cardPropertyText}>
                    Contact naam:
                  </Text>
                </View>
                <View style={globalStyles.cardValues}>
                  <Text style={globalStyles.cardValueText}>{item.name}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Transaction', {
                    contactId: item.contactId,
                    peerId: item.peerId
                  })
                }
              >
                <Text style={globalStyles.link}>
                  Transactie uitvoeren met {item.name}
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      </View>
    )
  }
}
