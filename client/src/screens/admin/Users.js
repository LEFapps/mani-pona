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
import { useNotifications } from '../../shared/notifications'

const EditIcon = props => (
  <MaterialCommunityIcons
    name={'pencil-circle'}
    size={16}
    style={{ marginHorizontal: 8, alignSelf: 'center' }}
    {...props}
  />
)

export const Users = ({ navigation, route }) => {
  const { maniClient } = global
  const notification = useNotifications()
  const [isBusy, setBusy] = useState(false)
  const [searchText, setSearch] = useState('')
  const [errorText, setError] = useState('')
  const [result, setResult] = useState()
  const [openEditor, setEditor] = useState()

  const doSearch = () => {
    setBusy(true)
    setError('')
    setEditor('')
    maniClient.system
      .findUser(searchText)
      .then(user => {
        if (user) {
          maniClient.system
            .accountTypes()
            .then(types => {
              const { demurrage, income, buffer } = types.find(
                ({ type }) => type === (user.type || 'default')
              )
              user.demurrage = demurrage
              user.income = mani(income)
              user.buffer = mani(buffer)

              maniClient.admin
                .available(user.ledger)
                .then(({ balance }) => {
                  user.balance = balance
                  maniClient.admin
                    .pending(user.ledger)
                    .then(p => {
                      if (p && p.toSign) user.pending = p.amount
                      setResult(user)
                      setBusy(false)
                    })
                    .catch(e => {
                      console.error('findUser/pending', e)
                    })
                })
                .catch(e => {
                  console.error('findUser/available', e)
                })
            })
            .catch(e => {
              console.error('system/accountTypes', e)
            })
        }
      })
      .catch(e => {
        setBusy(false)
        console.error('search/findUser', e)
        notification.add({
          type: 'warning',
          title: 'search/findUser',
          message: e && e.message
        })
      })
  }

  const fields = [
    'alias',
    // 'sub',
    'email',
    'email_verified',
    'administrator',
    'address',
    'zip',
    'city',
    'phone',
    'birthday',
    'companyTaxNumber',
    'status',
    'enabled',
    'created',
    'lastModified',
    'ledger',
    'requestedType',
    'type',
    'pending',
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
        onChangeText={text => {
          setSearch(text)
          setResult(false)
          setEditor('')
        }}
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
            const value = result[item]
            const Editor = editable[item]
            return (
              <TouchableOpacity onPress={() => setEditor(item)}>
                <Card>
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={globalStyles.property}>{item}</Text>
                    {!!Editor && (
                      <Editor
                        visible={openEditor === item}
                        user={result}
                        onClose={refetch => {
                          if (refetch === true) refetch && doSearch()
                          else if (refetch) universalAlert.alert(refetch)
                          setEditor('')
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

export default Users
