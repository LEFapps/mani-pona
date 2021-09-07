import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Home from '../../screens/qr'
import QRCode from '../../screens/qr-code'
import Overview from '../../screens/overview'
import ContributionPrediction from '../../screens/contributionPrediction'
import Transaction from '../../screens/transactionFromHome'
import AddContact from '../../screens/addContact'

import IncomePrediction from '../../screens/incomePredictions'

import Header from '../../shared/header'

const HomeStack = createStackNavigator()

const homeStack = () => {
  return (
    <HomeStack.Navigator
      initialRouteName='Home'
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
      {/* <HomeStack.Screen
        name='Home'
        component={Home}
        options={() => ({
          headerTitle: () => <Header title='LoREco' icon='menu' />
        })}
      /> */}
      <HomeStack.Screen
        name='QRCode'
        component={QRCode}
        options={{ title: 'QR-code', headerBackTitle: 'Terug' }}
      />
      {/* <HomeStack.Screen
        name='AccountBalance'
        component={Overview}
        options={{ title: 'Overzicht', headerBackTitle: 'Terug' }}
      /> */}
      {/* <HomeStack.Screen
        name='IncomePrediction'
        component={IncomePrediction}
        options={{ title: 'Voorspelling Inkomen', headerBackTitle: 'Terug' }}
      /> */}
      {/* <HomeStack.Screen
        name='ContributionPrediction'
        component={ContributionPrediction}
        options={{ title: 'Voorspelling Bijdrage', headerBackTitle: 'Terug' }}
      /> */}
      {/* <HomeStack.Screen
        name='AddContact'
        component={AddContact}
        options={{ title: 'Contact Toevoegen', headerBackTitle: 'Terug' }}
      /> */}
      {/* <HomeStack.Screen
        name='Transaction'
        component={Transaction}
        options={{ title: 'Transactie', headerBackTitle: 'Terug' }}
      /> */}
    </HomeStack.Navigator>
  )
}

export default homeStack
