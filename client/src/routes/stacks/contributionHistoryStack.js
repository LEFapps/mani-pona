import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import Header from '../../shared/header'

import ContributionHistory from '../../screens/contributionHistory'
import Predictions from '../../screens/predictions'

const Nav = createStackNavigator()

const contributionHistoryStack = () => {
  const isFocused = useIsFocused()
  return (
    isFocused && (
      <Nav.Navigator
        initialRouteName='ContributionHistory'
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
        <Nav.Screen
          name='ContributionHistory'
          component={ContributionHistory}
          options={() => ({
            headerTitle: () => (
              <Header title='Bijdrage Geschiedenis' icon='menu' />
            )
          })}
        />
        <Nav.Screen
          name='Predictions'
          component={Predictions}
          options={{ title: 'Voorspellingen', headerBackTitle: 'Terug' }}
        />
      </Nav.Navigator>
    )
  )
}

export default contributionHistoryStack
