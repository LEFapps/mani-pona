import React from 'react'
import { Text } from 'react-native'
// import { createDrawerNavigator } from 'react-navigation-drawer-no-warnings'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { useIsFocused } from '@react-navigation/native'

import { Dashboard, Parameters, Users } from '../../screens/admin/stacks'

import Header from '../../shared/header'

const AdminDrawer = createDrawerNavigator()

const title = name => <Header title={name} icon='menu' />

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
      options: { drawerLabel: 'Dashboard' }
    },
    {
      name: 'parameters',
      component: Parameters,
      options: { drawerLabel: 'Parameters' }
    },
    {
      name: 'users',
      component: Users,
      options: { drawerLabel: 'Rekeningen' }
    }
  ]

  return (
    isFocused && (
      <AdminDrawer.Navigator
        initialRouteName='parameters'
        screenOptions={headerOptions}
      >
        {adminScreens.map((screen, key) => (
          <AdminDrawer.Screen {...screen} key={key} />
        ))}
        {/* <AdminDrawer.Screen
          name={'dashboard'}
          component={Dashboard}
          options={{ drawerLabel: 'Dashboard' }}
        />
        <AdminDrawer.Screen
          name={'parameters'}
          component={Parameters}
          options={{ drawerLabel: 'Parameters' }}
        />
        <AdminDrawer.Screen
          name={'users'}
          component={Users}
          options={{ drawerLabel: 'Rekeningen' }}
        /> */}
      </AdminDrawer.Navigator>
    )
  )
}

export default Admin
