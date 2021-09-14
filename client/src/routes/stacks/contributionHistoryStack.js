import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import Header from '../../shared/header'

import ContributionHistory from '../../screens/contributionHistory'
import IncomePrediction from '../../screens/incomePredictions'
import ContributionPrediction from '../../screens/contributionPrediction'

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
          name='IncomePrediction'
          component={IncomePrediction}
          options={{ title: 'Voorspelling Inkomen', headerBackTitle: 'Terug' }}
        />
        <Nav.Screen
          name='ContributionPrediction'
          component={ContributionPrediction}
          options={{ title: 'Voorspelling Bijdrage', headerBackTitle: 'Terug' }}
        />
      </Nav.Navigator>
    )
  )
}

export default contributionHistoryStack
