import React, { useState, useEffect } from 'react'
import { ScrollView, Text, FlatList } from 'react-native'

import Card from '../shared/card'
import { sortBy } from '../../shared/tools'
import { globalStyles } from '../styles/global'
import { useNotifications } from '../shared/notifications'

export default function Home () {
  const { maniClient } = global
  const notification = useNotifications()
  const [ready, setReady] = useState(false)
  const [contributions, setContributions] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    maniClient.transactions
      .recent()
      .then((transactions = []) => {
        setContributions(transactions.sort(sortBy('date', 'DESC')))
        setReady(true)
      })
      .catch(e => {
        console.error('transactions/recent', e)
        notification.add({
          type: 'warning',
          title: 'Bijdragen laden mislukt',
          message: e && e.message
        })
      })
  }

  if (ready === false) return null

  return (
    <ScrollView style={globalStyles.main}>
      <FlatList
        data={contributions}
        keyExtractor={item => JSON.stringify(item)} // TODO: handle keys smarter
        renderItem={({ item }) => (
          <Card>
            <Text style={globalStyles.property}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={globalStyles.price}>
              {item.demurrage && item.demurrage.format().replace('ɱ', '₭')}
            </Text>
          </Card>
        )}
      />
    </ScrollView>
  )
}
