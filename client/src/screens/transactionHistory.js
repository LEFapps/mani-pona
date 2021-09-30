import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'

import { Contact } from '../shared/contact'
import Card from '../shared/card'
import FlatButton from '../shared/buttons/historyButton'

import { globalStyles } from '../styles/global'

export default function TransactionHitstory ({ navigation }) {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.transactions.recent().then(transactions => {
      setTransactions(transactions)
    })
    setReady(true)
  }

  const filters = [
    {
      title: 'Alle',
      onPress: () => setFilter('all'),
      active: () => filter === 'all'
    },
    {
      title: 'Betaald',
      onPress: () => setFilter('payd'),
      active: () => filter === 'payd'
    },
    {
      title: 'Ontvangen',
      onPress: () => setFilter('received'),
      active: () => filter === 'received'
    }
  ]

  const transactionsToShow = transactions.filter(({ amount }) => {
    switch (filter) {
      case 'payd':
        return amount.negative()
      case 'received':
        return amount.positive()
      default:
        return true
    }
  })

  if (ready) {
    return (
      <View style={globalStyles.main}>
        <FlatButton options={filters} />
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
