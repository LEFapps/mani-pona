import React, { useContext } from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useIsFocused } from '@react-navigation/native'

import { UserContext } from '../../authenticator'

import Scan from '../../screens/qr'
import Create from '../../screens/qr-code'
import Overview from '../../screens/overview'
import Predictions from '../../screens/predictions'

import { colors } from '../../helpers/helper'

const Nav = createMaterialTopTabNavigator()

const qrStack = () => {
  const isFocused = useIsFocused()
  const user = useContext(UserContext)
  const { 'custom:type': userType } = (user && user.attributes) || {}

  return (
    isFocused && (
      <Nav.Navigator
        initialRouteName={
          userType === 'professional' ? 'Create' : 'AccountBalance'
        }
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
          options={{ title: 'LoREco', headerBackTitle: 'Terug' }}
        />
        <Nav.Screen
          name='Scan'
          component={Scan}
          options={{
            title: 'Scannen',
            headerBackTitle: 'LoREco',
            lazy: true
          }}
        />
        <Nav.Screen
          name='Create'
          component={Create}
          options={{ title: 'Maken', headerBackTitle: 'LoREco' }}
        />
        <Nav.Screen
          name='Predictions'
          component={Predictions}
          options={{
            title: 'Prognose',
            headerBackTitle: 'LoREco',
            lazy: true
          }}
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
