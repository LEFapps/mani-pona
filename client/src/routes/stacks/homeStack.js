import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import StandingOrders from '../../screens/standingOrders'

const HomeStack = createStackNavigator()

const homeStack = () => {
  const isFocused = useIsFocused()
  return (
    isFocused && (
      <HomeStack.Navigator
        initialRouteName='StandingOrders'
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
        <HomeStack.Screen name='StandingOrders' component={StandingOrders} />
      </HomeStack.Navigator>
    )
  )
}

export default homeStack
