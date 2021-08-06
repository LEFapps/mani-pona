import React from 'react'
import { createDrawerNavigator } from 'react-navigation-drawer-no-warnings'
import { NavigationContainer } from '@react-navigation/native'
import { View } from 'react-native'

import AccountStack from '../routes/stacks/accountStack'

import HomeStack from '../routes/stacks/homeStack'
import TransactionHistoryStack from '../routes/stacks/transactionHistoryStack'
import ContributionHistoryStack from '../routes/stacks/contributionHistoryStack'
import StandingOrderStack from '../routes/stacks/standingOrderStack'
import FreeBufferStack from '../routes/stacks/freeBufferStack'
import ContactListStack from '../routes/stacks/contactListStack'
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons'
import { globalStyles } from '../styles/global'

export default function drawerNavigator (props) {
  const Drawer = createDrawerNavigator()

  if (props.authState === 'signedIn') {
    return (
      <View style={globalStyles.container}>
        <NavigationContainer>
          <Drawer.Navigator
            drawerContentOptions={{
              activeBackgroundColor: '#2B8AA0',
              activeTintColor: 'white',
              inactiveTintColor: '#2B8AA0',
              labelStyle: { fontWeight: 'bold', fontSize: 16 }
            }}
            drawerStyle={{
              width: '90%',
              backgroundColor: 'white',
              paddingTop: 20
            }}
          >
            <Drawer.Screen
              name='Home'
              component={HomeStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='home'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />
            <Drawer.Screen
              name='Transactie Geschiedenis'
              component={TransactionHistoryStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='history'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />
            <Drawer.Screen
              name='Bijdrage Geschiedenis'
              component={ContributionHistoryStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='swap-vertical-circle'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />

            <Drawer.Screen
              name='Betalingsopdrachten'
              component={StandingOrderStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='loop'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />
            <Drawer.Screen
              name='Beheer Vrije Buffer'
              component={FreeBufferStack}
              options={{
                drawerIcon: props => (
                  <Entypo
                    name='bar-graph'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />

            <Drawer.Screen
              name='Contacten'
              component={ContactListStack}
              options={{
                drawerIcon: props => (
                  <MaterialCommunityIcons
                    name='contacts'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />
            <Drawer.Screen
              name='Account'
              component={AccountStack}
              options={{
                drawerIcon: props => (
                  <MaterialCommunityIcons
                    name='account-circle'
                    color={props.color}
                    size={props.size}
                  />
                )
              }}
            />
          </Drawer.Navigator>
        </NavigationContainer>
      </View>
    )
  } else {
    return null
  }
}
