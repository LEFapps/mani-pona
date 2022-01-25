import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'
import Help from '../../screens/help'
import Header from '../../shared/header'

const HelpStack = createStackNavigator()

const helpStack = () => {
  const isFocused = useIsFocused()

  return (
    isFocused && (
      <HelpStack.Navigator
        initialRouteName='Help'
        screenOptions={{
          headerStyle: {
            backgroundColor: '#00a3e4'
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold'
          },
          headerTitleAlign: 'center'
        }}
      >
        <HelpStack.Screen
          name='Help'
          component={Help}
          options={() => ({
            headerTitle: () => <Header title='Help' icon='menu' />
          })}
        />
      </HelpStack.Navigator>
    )
  )
}

export default helpStack
