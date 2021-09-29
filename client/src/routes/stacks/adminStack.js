import React from 'react'
import { Text } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import { Dashboard, Parameters, Users, User } from '../../screens/admin'

const AdminStack = createStackNavigator()

export const Admin = () => {
  const isFocused = useIsFocused()

  const headerOptions = {
    headerStyle: { backgroundColor: '#2B8AA0' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
    headerTitleAlign: 'center'
  }

  const adminScreens = [
    {
      name: 'dashboard',
      component: Dashboard,
      options: { title: 'Dashboard' }
    },
    {
      name: 'parameters',
      component: Parameters,
      options: { title: 'Parameters' }
    },
    {
      name: 'users',
      component: Users,
      options: { title: 'Rekeningen' }
    },
    {
      name: 'users/user',
      component: User,
      options: { title: 'Rekening' }
    }
  ]

  return (
    isFocused && (
      <AdminStack.Navigator
        initialRouteName='parameters'
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
