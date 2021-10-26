import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons'
import loglevel from 'loglevel'
import uniq from 'lodash/uniq'

import { Contact } from '../../shared/contact'
import Alert from '../../shared/alert'
import Card from '../../shared/card'
import FlatButton from '../../shared/buttons/historyButton'

import { sortBy } from '../../../shared/tools'
import { globalStyles } from '../../styles/global'
import { keyWarehouse } from '../../maniClient'
import { colors } from '../../helpers/helper'

const log = loglevel.debug
const err = loglevel.error

const ask = 'loreco-accounts' // accountStoreKey

export const accountStore = {
  async getAccounts () {
    log('ACCOUNTS: retrieving accounts list')
    try {
      const list = await AsyncStorage.getItem(ask)
      return JSON.parse(list) || []
    } catch (error) {
      err(error)
    }
  },

  async saveAccount (account) {
    const accounts = await this.getAccounts()
    accounts.splice(0, 0, account)
    log('ACCOUNTS: adding ' + account)
    try {
      await AsyncStorage.setItem(ask, JSON.stringify(uniq(accounts)))
    } catch (error) {
      err(error)
    }
  },

  async removeAccount (account) {
    const accounts = await this.getAccounts()
    const index = accounts.indexOf(account)
    accounts.splice(index, 1)
    log('ACCOUNTS: removing ' + account + ' (at index ' + index + ')')
    try {
      await AsyncStorage.setItem(ask, JSON.stringify(accounts))
    } catch (error) {
      err(error)
    }
  }
}

export const AccountsList = ({ onSelect }) => {
  const [isLoading, setLoading] = useState([])
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    getAccounts()
  }, [])

  const getAccounts = () =>
    keyWarehouse
      .list()
      .then(accounts => {
        setLoading(false)
        setAccounts(accounts)
      })
      .catch(e => {
        setLoading(false)
        console.error('A problem occurred while listing accounts:', e)
      })

  const createAccount = {
    username: 'new',
    icon: 'add-circle',
    title: 'Nieuw account maken…'
  }
  const importAccount = {
    username: 'import',
    icon: 'account-circle',
    title: 'Bestaand account toevoegen…'
  }
  const verifyAccount = {
    username: 'verify',
    icon: 'check-circle',
    title: 'Account verifiëren met code…'
  }

  const extAccounts = accounts.concat(
    createAccount,
    verifyAccount,
    importAccount
  )

  return (
    <View style={globalStyles.main}>
      <View style={{ marginVertical: 32 }}>
        {isLoading ? (
          <Text>Rekeningen zoeken…</Text>
        ) : (
          <FlatList
            keyExtractor={({ username, key }) => username || key}
            data={extAccounts}
            renderItem={({ item: { username, key, icon, title } }) => (
              <TouchableOpacity onPress={() => onSelect(username, key)}>
                <Card>
                  <Text style={globalStyles.property}>
                    {icon && (
                      <MaterialIcons
                        name={icon}
                        size={20}
                        color={colors.DarkerBlue}
                        style={{
                          marginRight: 8,
                          lineHeight: 1
                        }}
                      />
                    )}
                    {title || username || key}
                  </Text>
                  <Text style={globalStyles.price}>→</Text>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  )
}

export default AccountsList
