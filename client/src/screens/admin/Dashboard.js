import React from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { adminScreens } from '../../routes/stacks/adminStack'

import { globalStyles } from '../../styles/global'
import { colors } from '../../helpers/helper'
import Card from '../../shared/card'

export const Dashboard = ({ navigation, route }) => {
  const pages = adminScreens
    .slice(1) // do not include overview page
    .filter(({ name }) => name.indexOf('/') < 0) // filter nested screens
  return (
    <View style={globalStyles.main}>
      <FlatList
        keyExtractor={({ name }) => name}
        data={pages}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate(item.name)}>
            <Card>
              <View style={{ flexDirection: 'row' }}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={colors.DarkerBlue}
                  style={{ marginRight: 12 }}
                />
                <Text style={globalStyles.bigText}>{item.options.title}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

export default Dashboard
