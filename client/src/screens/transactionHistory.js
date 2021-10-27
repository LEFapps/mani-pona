import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  FlatList,
  TouchableOpacity
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { Contact } from '../shared/contact'
import Alert from '../shared/alert'
import Card from '../shared/card'
import FlatButton from '../shared/buttons/historyButton'
import { downloader } from '../helpers/downloader'
import { DarkSpinner } from '../helpers/loader'

import { sortBy } from '../../shared/tools'
import { globalStyles } from '../styles/global'

export default function TransactionHitstory ({ navigation }) {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  function loadData () {
    ManiClient.transactions
      .recent()
      .then(transactions => {
        transactions.sort(sortBy('date', 'DESC'))
        setTransactions(transactions)
        setReady(true)
      })
      .catch(e => {
        console.error('transactions/recent', e)
        e && Alert.alert(e.message)
      })
  }

  const filters = [
    {
      title: 'Alle',
      onPress: () => setFilter('all'),
      active: () => filter === 'all'
    },
    {
      title: 'Betaald',
      onPress: () => setFilter('paid'),
      active: () => filter === 'paid'
    },
    {
      title: 'Ontvangen',
      onPress: () => setFilter('received'),
      active: () => filter === 'received'
    }
  ]

  const transactionsToShow = transactions.filter(({ amount }) => {
    switch (filter) {
      case 'paid':
        return !!amount && amount.negative()
      case 'received':
        return !!amount && amount.positive()
      default:
        return true
    }
  })

  if (ready) {
    return (
      <ScrollView style={globalStyles.main}>
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
        <View style={{ marginTop: 32 }}>
          <ExportTransactions />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}

const ExportTransactions = () => {
  const { maniClient } = global

  const [isBusy, setBusy] = useState(false)

  const onPress = async () => {
    setBusy(true)
    const file = ['loreco-transacties-' + maniClient.id, 'text/csv']
    maniClient.transactions
      .export()
      .then(data => {
        downloader(data, ...file)
        setBusy(false)
      })
      .catch(e => {
        setBusy(false)
        console.error(method, e)
        Alert.alert(e.message || e)
      })
  }

  return (
    <TouchableOpacity onPress={isBusy ? undefined : onPress}>
      <Card>
        <View style={{ flexDirection: 'column' }}>
          <Text style={globalStyles.property}>Transacties downloaden</Text>
          <Text style={globalStyles.date}>(alles, csv-formaat)</Text>
        </View>
        <Text style={globalStyles.price}>
          {isBusy ? (
            <DarkSpinner size={24} />
          ) : (
            <MaterialCommunityIcons
              name={'database-export'}
              size={24}
              // style={{ marginHorizontal: 8, alignSelf: 'center' }}
            />
          )}
        </Text>
      </Card>
    </TouchableOpacity>
  )
}
