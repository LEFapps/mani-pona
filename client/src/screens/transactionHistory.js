import React, { useState, useEffect } from 'react'
import {
  ScrollView,
  View,
  Text,
  FlatList,
  TouchableOpacity
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { sortBy } from '../../shared/tools'

import { Exportable } from './admin/Exports'
import { Contact } from '../shared/contact'
import Card from '../shared/card'
import FlatButton from '../shared/buttons/historyButton'
import { useNotifications } from '../shared/notifications'
import { globalStyles } from '../styles/global'
import { colors } from '../helpers/helper'

const TransactionListItem = ({
  destination,
  date,
  amount,
  income,
  demurrage
}) => {
  return (
    <Card>
      <View style={{ flexDirection: 'column' }}>
        <Contact style={globalStyles.property} ledger={destination} />
        <View style={{ marginTop: 8 }}>
          <Text style={globalStyles.date}>
            {new Date(date).toLocaleString('nl-BE')}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'column', textAlign: 'right' }}>
        <Text style={globalStyles.price}>
          {amount.format().replace('ɱ', '₭')}
        </Text>
        <View style={{ marginTop: 8 }}>
          {((income && !income.zero()) || (demurrage && !demurrage.zero())) && (
            <MaterialCommunityIcons
              name='crown'
              size='20'
              color={colors.CurrencyColor}
            />
          )}
        </View>
      </View>
    </Card>
  )
}

export default function TransactionHitstory ({ navigation }) {
  const { maniClient } = global

  const notification = useNotifications()

  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  function loadData () {
    maniClient.transactions
      .recent()
      .then(transactions => {
        transactions.sort(sortBy('date', 'DESC'))
        setTransactions(transactions)
        setReady(true)
      })
      .catch(e => {
        console.error('transactions/recent', e)
        notification.add({
          type: 'warning',
          message: e && e.message,
          title: 'transactions/recent'
        })
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
            renderItem={({ item: transaction }) => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TransactionDetail', {
                    transaction
                  })
                }
              >
                <TransactionListItem {...transaction} />
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={{ marginTop: 32 }}>
          <Exportable
            exportable={'ledgerTransactions'}
            title={
              <View style={{ flexDirection: 'column' }}>
                <Text style={globalStyles.property}>
                  Transacties downloaden
                </Text>
                <Text style={globalStyles.date}>(alles, csv-formaat)</Text>
              </View>
            }
            filename={`loreco-transacties-${maniClient.id}`}
          />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
