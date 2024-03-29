import React from 'react'
import { Text } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import {
  Dashboard,
  Parameters,
  Users,
  Prepaid,
  Exports
} from '../../screens/admin'

const AdminStack = createStackNavigator()

const headerOptions = {
  headerStyle: { backgroundColor: '#00a3e4' }, // Klavers' custom style
  // headerStyle: { backgroundColor: '#2B8AA0' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
  headerTitleAlign: 'center'
}

export const adminScreens = [
  {
    name: 'dashboard',
    component: Dashboard,
    options: { title: 'Dashboard' },
    icon: 'wrench'
  },
  {
    name: 'parameters',
    component: Parameters,
    options: { title: 'Parameters' },
    icon: 'gauge'
  },
  {
    name: 'users',
    component: Users,
    options: { title: 'Gebruikers' },
    icon: 'account-group'
  },
  {
    name: 'prepaid',
    component: Prepaid,
    options: { title: 'Offline betalingen' },
    icon: 'credit-card-outline'
  }
]

export const Admin = () => {
  const isFocused = useIsFocused()

  return (
    isFocused && (
      <AdminStack.Navigator
        initialRouteName='dashboard'
        screenOptions={headerOptions}
      >
        {adminScreens.map((screen, key) => (
          <AdminStack.Screen {...screen} key={key} />
        ))}
      </AdminStack.Navigator>
    )
  )
}

export default Admin
