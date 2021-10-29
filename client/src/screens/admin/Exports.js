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

import Card from '../../shared/card'
import universalAlert from '../../shared/alert'
import { downloader } from '../../helpers/downloader'

import { globalStyles } from '../../styles/global'
import { DarkSpinner } from '../../shared/loader'

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

  const [isBusy, setBusy] = useState(false)

  const dl = async (method, file, key = true) => {
    setBusy(key)
    method()
      .then(data => {
        downloader(data, ...file)
        setBusy(false)
      })
      .catch(e => {
        setBusy(false)
        console.error(method, e)
        universalAlert.alert(e.message || e)
      })
  }

  const exportables = [
    {
      key: 'exportLedgers',
      title: 'Rekeningen',
      onPress: () =>
        dl(
          maniClient.admin.exportLedgers,
          ['loreco-rekeningen', 'text/csv'],
          'exportLedgers'
        )
    }
  ]

  return (
    <ScrollView style={globalStyles.main}>
      <FlatList
        keyExtractor={({ key }) => key}
        data={exportables}
        renderItem={({ item }) => {
          const { title, onPress, key } = item || {}
          return (
            <TouchableOpacity onPress={isBusy ? undefined : onPress}>
              <Card>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={globalStyles.property}>{title}</Text>
                </View>
                <Text style={globalStyles.price}>
                  {isBusy === key ? (
                    <DarkSpinner size={20} />
                  ) : (
                    <MaterialCommunityIcons
                      name={'database-export'}
                      size={20}
                      // style={{ marginHorizontal: 8, alignSelf: 'center' }}
                    />
                  )}
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
