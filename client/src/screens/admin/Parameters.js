import React, { useContext, useEffect, useState } from 'react'
import { View, Text, FlatList, Button } from 'react-native'
import { ScrollView } from 'react-native-web'

import Card from '../../shared/card'
import { globalStyles } from '../../styles/global'

const Screen = ({ navigation, route }) => {
  const { maniClient } = global
  const notification = useContext(Notification)
  const [parameters, setParameters] = useState()
  const [errorText, setError] = useState('')

  useEffect(() => {
    getParameters()
  }, [])

  const getParameters = () => {
    setError('')
    maniClient.system
      .accountTypes()
      .then(setParameters)
      .catch(e => {
        console.error('system/accountTypes', e)
        notification.add({
          type: 'warning',
          title: 'system/accountTypes',
          message: e && e.message
        })
      })
  }

  return (
    <ScrollView style={globalStyles.main}>
      {!!errorText && (
        <View style={globalStyles.paragraph}>
          <Text style={globalStyles.errorText}>{errorText}</Text>
        </View>
      )}
      {parameters && (
        <FlatList
          data={parameters}
          keyExtractor={({ type }) => type}
          renderItem={({ item }) => {
            const { type, income, buffer, demurrage } = item || {}
            return (
              <View style={{ marginVertical: 16 }}>
                <Text style={globalStyles.bigText}>{type}</Text>
                <Card>
                  <Text style={globalStyles.property}>Inkomen</Text>
                  <Text style={globalStyles.price}>{income}</Text>
                </Card>
                <Card>
                  <Text style={globalStyles.property}>Vrije buffer</Text>
                  <Text style={globalStyles.price}>{buffer}</Text>
                </Card>
                <Card>
                  <Text style={globalStyles.property}>
                    Gemeenschapsbijdrage
                  </Text>
                  <Text style={globalStyles.price}>{demurrage} %</Text>
                </Card>
              </View>
            )
          }}
        />
      )}
    </ScrollView>
  )
}

export default Screen
