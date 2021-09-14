import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'
import Account from '../../screens/account'
import Header from '../../shared/header'

const AccountStack = createStackNavigator()

const accountStack = () => {
  const isFocused = useIsFocused()

  return (
    isFocused && (
      <AccountStack.Navigator
        initialRouteName='Account'
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2B8AA0'
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold'
          },
          headerTitleAlign: 'center'
        }}
      >
        <AccountStack.Screen
          name='Account'
          component={Account}
          options={() => ({
            headerTitle: () => <Header title='Account' icon='menu' />
          })}
        />
      </AccountStack.Navigator>
    )
  )
}

export default accountStack
