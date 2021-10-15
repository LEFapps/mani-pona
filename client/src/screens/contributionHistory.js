import React, { useState, useEffect } from 'react'
import { View, Text, FlatList } from 'react-native'

import Card from '../shared/card'
import Alert from '../shared/alert'
import { sortBy } from '../../shared/tools'
import { globalStyles } from '../styles/global'

export default function Home () {
  const [contributions, setContributions] = useState([])
  const [ready, setReady] = useState(false)
  const { maniClient } = global

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    maniClient.transactions
      .recent()
      .then((transactions = []) => {
        setContributions(
          transactions
            .sort(sortBy('date', 'DESC'))
            .filter(({ destination }) => destination === 'system')
        )
        setReady(true)
      })
      .catch(e => {
        console.error('transactions/recent', e)
        e && Alert.alert(e.message)
      })
  }

  if (ready === false) {
    return null
  } else {
    return (
      <View style={globalStyles.main}>
        <FlatList
          data={contributions}
          keyExtractor={item => JSON.stringify(item)} // TODO: handle keys smarter
          renderItem={({ item }) => (
            <Card>
              <Text style={globalStyles.property}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              <Text style={globalStyles.price}>{item.amount.format()}</Text>
            </Card>
          )}
        />
      </View>
    )
  }
}
