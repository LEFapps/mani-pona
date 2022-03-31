import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import get from 'lodash/get'

import Card from '../../shared/card'
import universalAlert from '../../shared/alert'
import { downloader } from '../../helpers/downloader'

import { globalStyles } from '../../styles/global'
import { DarkSpinner } from '../../shared/loader'
import { useNotifications } from '../../shared/notifications'

const exportables = {
  ledgers: {
    title: 'Exporteer transactiedata',
    method: 'admin.exportLedgers',
    file: 'loreco-rekeningen',
    type: 'text/csv'
  },
  ledgerTransactions: {
    title: 'Exporteer transacties',
    method: 'transactions.export',
    file: 'loreco-transacties-ledger',
    type: 'text/csv'
  }
}

export const Exportable = ({ exportable, args = [], ...props }) => {
  const { maniClient } = global

  const notification = useNotifications()
  const [isBusy, setBusy] = useState(false)

  const exporter = exportables[exportable]
  if (!exporter) return null
  const { title, method, file, type } = exporter
  const onPress = async () => {
    setBusy(true)
    const fx = get(maniClient, method)
    if (!fx) {
      notification.add({
        type: 'warning',
        title: 'Export niet gevonden',
        message: `De exportmethode “${method}” is niet gedefinieerd.`
      })
      setBusy(false)
      return
    }
    fx(...args)
      .then(data => {
        downloader(data, props.filename || file, type)
        setBusy(false)
      })
      .catch(e => {
        setBusy(false)
        console.error(method, e)
        notification.add({
          type: 'warning',
          title: method,
          message: e && e.message
        })
      })
  }

  return (
    <TouchableOpacity onPress={isBusy ? undefined : onPress}>
      <Card>
        <View style={{ flexDirection: 'column' }}>
          {props.title ? (
            props.title
          ) : (
            <Text style={globalStyles.property}>{title}</Text>
          )}
        </View>
        <Text style={globalStyles.price}>
          {isBusy ? (
            <DarkSpinner size={20} />
          ) : (
            <MaterialCommunityIcons name={'database-export'} size={20} />
          )}
        </Text>
      </Card>
    </TouchableOpacity>
  )
}

export const Downloads = ({ navigation, route }) => {
  return (
    <ScrollView style={globalStyles.main}>
      <FlatList
        keyExtractor={key => key}
        data={Object.keys(exportables)}
        renderItem={({ item }) => <Exportable key={item} exportable={item} />}
      />
    </ScrollView>
  )
}

export default Downloads
