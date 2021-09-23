import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'

import Card from '../shared/card'
import { HistoryButton } from '../shared/buttons/historyButton'
import { globalStyles } from '../styles/global'
import MANI from '../../shared/mani'
import { Contact } from '../shared/contact'

export default function TransactionHitstory ({ navigation }) {
  const [transactions, setTransactions] = useState([])
  const [transactionsToShow, setTransactionsToShow] = useState([])
  const [contacts, setContacts] = useState([])
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setTransactionsToShow(transactions)
  }, [transactions])

  async function loadData () {
    await ManiClient.transactions.recent().then(transactions => {
      setTransactions(transactions)
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

  const [Background, setBackground] = useState({
    all: 'white',
    payd: 'transparent',
    received: 'transparent'
  })

  const filter = value => {
    if (value == 'all') {
      setTransactionsToShow(transactions)
      setBackground({
        all: 'white',
        payd: 'transparent',
        received: 'transparent'
      })
    } else if (value == 'payd') {
      let payd = []
      transactions.forEach(transaction => {
        if (transaction.amount < 0) {
          payd.push(transaction)
        }
      })
      setTransactionsToShow(payd)
      setBackground({
        all: 'transparent',
        payd: 'white',
        received: 'transparent'
      })
    } else if (value == 'received') {
      let recieved = []
      transactions.forEach(transaction => {
        if (transaction.amount > 0) {
          recieved.push(transaction)
        }
      })
      setTransactionsToShow(recieved)
      setBackground({
        all: 'transparent',
        payd: 'transparent',
        received: 'white'
      })
    }
  }

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <HistoryButton
          onPressAll={() => filter('all')}
          onPressPayd={() => filter('payd')}
          onPressReceived={() => filter('received')}
          allBackground={Background.all}
          paydBackground={Background.payd}
          receivedBackground={Background.received}
        />
        <View>
          <FlatList
            keyExtractor={({ ledger, destination, date }) =>
              `${ledger}-${destination}-${date}`
            }
            data={transactionsToShow}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TransactionDetail', {
                    transaction: item
                  })
                }
              >
                <Card>
                  <View style={{ flexDirection: 'column' }}>
                    <Contact
                      style={globalStyles.property}
                      ledger={item.destination}
                    />
                    <Text style={globalStyles.date}>
                      {new Date(item.date).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={globalStyles.price}>{item.amount.format()}</Text>
                </Card>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    )
  } else {
    return null
  }
}
