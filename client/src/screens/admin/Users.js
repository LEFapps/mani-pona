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

import { globalStyles } from '../../styles/global'

const EditIcon = props => (
  <MaterialCommunityIcons
    name={'pencil-circle'}
    size={16}
    style={{ marginHorizontal: 8, alignSelf: 'center' }}
    {...props}
  />
)

export const Dashboard = ({ navigation, route }) => {
  const { maniClient } = global
  const [isBusy, setBusy] = useState(false)
  const [searchText, setSearch] = useState('')
  const [errorText, setError] = useState('')
  const [result, setResult] = useState()
  const [details, setDetails] = useState({})
  const [current, setCurrent] = useState({})
  const [openEditor, setEditor] = useState()

  const doSearch = () => {
    setBusy(true)
    setError('')
    maniClient.system
      .findUser(searchText)
      .then(user => {
        setBusy(false)
        if (user) {
          setResult(user)
          maniClient.system
            .accountTypes()
            .then(types => {
              const { demurrage, income, buffer } = types.find(
                ({ type }) => type === (user.type || 'default')
              )
              setDetails({
                demurrage,
                income: mani(income),
                buffer: mani(buffer)
              })
            })
            .catch(e => {
              console.error('system/accountTypes', e)
            })
          maniClient.transactions
            .current(user.ledger)
            .then(({ balance }) => setCurrent({ balance }))
            .catch(e => {
              console.error('findUser/current', e)
            })
        }
      })
      .catch(e => {
        setBusy(false)
        console.error('search/findUser', e)
        setError(e.message || e)
      })
  }

  const fields = [
    'alias',
    // 'sub',
    'email',
    'email_verified',
    'administrator',
    'status',
    'enabled',
    'created',
    'lastModified',
    'ledger',
    'requestedType',
    'type',
    'balance',
    'income',
    'demurrage',
    'buffer'
  ]

  return (
    <ScrollView style={globalStyles.main}>
      <Text style={globalStyles.label}>Zoek een rekening</Text>
      <TextInput
        style={globalStyles.input}
        placeholder='e-mailadres'
        onChangeText={setSearch}
        value={searchText}
      />

      {!!searchText && <Button text='Zoeken' onPress={doSearch} />}
      {!!isBusy && <Text>Zoeken…</Text>}
      {!!errorText && <Text style={globalStyles.errorText}>{errorText}</Text>}

      {!!result && (
        <FlatList
          keyExtractor={item => item}
          data={fields}
          renderItem={({ item }) => {
            const value = result[item] || details[item] || current[item]
            const Editor = editable[item]
            return (
              <TouchableOpacity onPress={() => setEditor(item)}>
                <Card>
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={globalStyles.property}>{item}</Text>
                    {!!Editor && (
                      <Editor
                        visible={openEditor === item}
                        user={{ ...result, ...details, ...current }}
                        onClose={refetch => {
                          if (refetch === true) refetch && doSearch()
                          if (refetch) universalAlert.alert(refetch)
                          setEditor()
                        }}
                      />
                    )}
                  </View>
                  <Text style={globalStyles.price}>
                    {!!Editor && <EditIcon />}
                    {value === true
                      ? 'ja'
                      : value
                      ? value.toString
                        ? value.toString()
                        : value
                      : '-'}
                  </Text>
                </Card>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </ScrollView>
  )
}

export default Dashboard
