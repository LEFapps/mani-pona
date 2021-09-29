import React from 'react'
import { View, Text } from 'react-native'

export const User = ({ navigation, route }) => {
  const { params = {} } = route || {}
  const { ledger, alias } = params
  return (
    <View>
      <Text>LoREco User {alias || ledger}</Text>
    </View>
  )
}

export default User
