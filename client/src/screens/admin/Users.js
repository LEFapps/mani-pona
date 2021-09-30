import React, { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native'

import editable from './User'

import Button from '../../shared/buttons/button'
import Card from '../../shared/card'

import { globalStyles } from '../../styles/global'

export const Dashboard = ({ navigation, route }) => {
  const { maniClient } = global
  const [isBusy, setBusy] = useState(false)
  const [searchText, setSearch] = useState('')
  const [result, setResult] = useState()
  const [openEditor, setEditor] = useState()

  const doSearch = () => {
    setBusy(true)
    maniClient.system
      .findUser(searchText)
      .then(user => {
        setBusy(false)
        user && setResult(user)
      })
      .catch(console.error)
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
    'type'
  ]

  return (
    <View style={globalStyles.main}>
      <Text style={globalStyles.label}>Zoek een rekening</Text>
      <TextInput
        style={globalStyles.input}
        placeholder='e-mailadres'
        onChangeText={setSearch}
        value={searchText}
      />

      {!!searchText && <Button text='Zoeken' onPress={doSearch} />}

      {!!isBusy && <Text>Zoeken…</Text>}

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
                    {Editor && (
                      <Editor
                        visible={openEditor === item}
                        user={result}
                        onClose={refetch => {
                          refetch && doSearch()
                          setEditor()
                        }}
                      />
                    )}
                  </View>
                  <Text style={globalStyles.price}>
                    {value === true ? 'ja' : value || '-'}
                  </Text>
                </Card>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

export default Dashboard
