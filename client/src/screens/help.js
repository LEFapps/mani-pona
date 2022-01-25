import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global'
import Card from '../shared/card'
import CustomButton from '../shared/buttons/button'

export default function Help () {
  return (
    <ScrollView style={globalStyles.main}>
      <View style={{ marginBottom: 10 }}>
        <Card>
          <Text style={globalStyles.cardPropertyText}>Info</Text>
          <CustomButton text='Contact' />
        </Card>
      </View>
    </ScrollView>
  )
}
