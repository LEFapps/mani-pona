import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import mani from '../../../shared/mani'

import editable from './User'

import Button from '../../shared/buttons/button'
import Card from '../../shared/card'
import universalAlert from '../../shared/alert'
import { downloader } from '../../helpers/downloader'

import { globalStyles } from '../../styles/global'

const EditIcon = props => (
  <MaterialCommunityIcons
    name={'pencil-circle'}
    size={16}
    style={{ marginHorizontal: 8, alignSelf: 'center' }}
    {...props}
  />
)

export const Download = ({ navigation, route }) => {
  const { maniClient } = global

  const dl = async (method, file) => {
    const data = await method()
    downloader(data, ...file)
  }

  const exportables = [
    {
      title: 'Rekeningen',
      onPress: () =>
        dl(maniClient.admin.exportLedgers, ['loreco-rekeningen', 'text/csv'])
    }
  ]

  return (
    <ScrollView style={globalStyles.main}>
      <FlatList
        keyExtractor={({ title }) => title}
        data={exportables}
        renderItem={({ item }) => {
          const { title, onPress } = item || {}
          return (
            <TouchableOpacity onPress={onPress}>
              <Card>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={globalStyles.property}>{title}</Text>
                </View>
                <Text style={globalStyles.price}>
                  <MaterialCommunityIcons
                    name={'database-export'}
                    size={20}
                    // style={{ marginHorizontal: 8, alignSelf: 'center' }}
                  />
                </Text>
              </Card>
            </TouchableOpacity>
          )
        }}
      />
    </ScrollView>
  )
}

export default Download
