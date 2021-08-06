import React, { useState, useEffect } from 'react'
import { View, Text, FlatList } from 'react-native'

import Card from '../shared/card'
import { globalStyles } from '../styles/global'
import mani from '../../shared/mani'

export default function Home () {
  const [contributions, setContributions] = useState([])
  const [ready, setReady] = useState(false)
  const ManiClient = global.maniClient

  useEffect(() => {
    loadData()
  }, [])

  async function loadData () {
    await ManiClient.demurageHistory.all().then(demurageHistory => {
      setContributions(demurageHistory)
    })
    setReady(true)
  }

  if (ready === false) {
    return null
  } else {
    return (
      <View style={globalStyles.main}>
        <FlatList
          data={contributions}
          keyExtractor={item => item.demurageId.toString()}
          renderItem={({ item }) => (
            <Card>
              <Text style={globalStyles.property}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              <Text style={globalStyles.price}>
                {mani(item.amount).format()}
              </Text>
            </Card>
          )}
        />
      </View>
    )
  }
}
