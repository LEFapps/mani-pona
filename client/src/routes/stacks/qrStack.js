import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'
import Scan from '../../screens/qr'
import Create from '../../screens/qr-code'
import Overview from '../../screens/overview'
import ContributionPrediction from '../../screens/contributionPrediction'
import Transaction from '../../screens/transactionFromHome'
import AddContact from '../../screens/addContact'

import IncomePrediction from '../../screens/incomePredictions'

import { globalStyles } from '../../styles/global'
import { colors } from '../../helpers/helper'
import Header from '../../shared/header'
import { View, Text } from 'react-native'

const Nav = createMaterialTopTabNavigator()

const qrStack = () => {
  const isFocused = useIsFocused()
  return (
    isFocused && (
      <Nav.Navigator
        initialRouteName='AccountBalance'
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.DarkerBlue
          },
          tabBarActiveTintColor: colors.DarkerBlue,
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold'
          },
          headerTitleAlign: 'center'
        }}
      >
        <Nav.Screen
          name='AccountBalance'
          component={Overview}
          options={{ title: 'Overzicht', headerBackTitle: 'Terug' }}
        />
        <Nav.Screen
          name='Scan'
          component={Scan}
          options={{
            headerTitle: () => <Header title='Scan' icon='menu' />,
            headerBackTitle: 'LoREco'
          }}
        />
        <Nav.Screen
          name='Create'
          component={Create}
          options={{ title: 'Create', headerBackTitle: 'LoREco' }}
        />
        {/* <Nav.Screen
        name='IncomePrediction'
        component={IncomePrediction}
        options={{ title: 'Voorspelling Inkomen', headerBackTitle: 'Terug' }}
      /> */}
        {/* <Nav.Screen
        name='ContributionPrediction'
        component={ContributionPrediction}
        options={{ title: 'Voorspelling Bijdrage', headerBackTitle: 'Terug' }}
      /> */}
        {/* <Nav.Screen
        name='AddContact'
        component={AddContact}
        options={{ title: 'Contact Toevoegen', headerBackTitle: 'Terug' }}
      /> */}
        {/* <Nav.Screen
        name='Transaction'
        component={Transaction}
        options={{ title: 'Transactie', headerBackTitle: 'Terug' }}
      /> */}
      </Nav.Navigator>
    )
  )
}

export default qrStack
