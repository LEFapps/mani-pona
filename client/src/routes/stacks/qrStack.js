import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import Scan from '../../screens/qr'
import Create from '../../screens/qr-code'
import Overview from '../../screens/overview'
import ContributionPrediction from '../../screens/contributionPrediction'
import Transaction from '../../screens/transactionFromHome'
import AddContact from '../../screens/addContact'

import IncomePrediction from '../../screens/incomePredictions'

import Header from '../../shared/header'
import { View, Text } from 'react-native'

const HomeStack = createStackNavigator()

const Home = ({ navigation }) => {
  return (
    <View>
      <Text onPress={() => navigation.push('Scan')}>Scan</Text>
      <Text onPress={() => navigation.push('Create')}>Create</Text>
    </View>
  )
}

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
      <HomeStack.Screen
        name='Home'
        component={Home}
        options={{ headerTitle: () => <Header title='LoREco' icon='menu' /> }}
      />
      <HomeStack.Screen
        name='Scan'
        component={Scan}
        options={{
          headerTitle: () => <Header title='Scan' icon='menu' />,
          headerBackTitle: 'LoREco'
        }}
      />
      <HomeStack.Screen
        name='Create'
        component={Create}
        options={{ title: 'Create', headerBackTitle: 'LoREco' }}
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
