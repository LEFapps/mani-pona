import React from 'react'
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { View } from 'react-native'
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons'

import AccountStack from '../routes/stacks/accountStack'
import HomeStack from './stacks/homeStack'
import QrStack from '../routes/stacks/qrStack'
import TransactionHistoryStack from '../routes/stacks/transactionHistoryStack'
// import ContributionHistoryStack from '../routes/stacks/contributionHistoryStack'
// import StandingOrderStack from '../routes/stacks/standingOrderStack'
// import FreeBufferStack from '../routes/stacks/freeBufferStack'
// import ContactListStack from '../routes/stacks/contactListStack'
import { globalStyles } from '../styles/global'
import { colors } from '../helpers/helper'

const iconProps = { size: 32 }

export default function drawerNavigator (props) {
  const Nav = createMaterialBottomTabNavigator()

  if (props.authState === 'signedIn') {
    return (
      <View style={globalStyles.container}>
        <NavigationContainer>
          <Nav.Navigator barStyle={{ backgroundColor: colors.DarkerBlue }}>
            <Nav.Screen
              name='Overview'
              tabBarLabel='Overview'
              component={HomeStack}
              tabBarIcon={({ focused, color = 'white' }) => (
                <MaterialIcons name='home' color={color} {...iconProps} />
              )}
            />

            {/* <Nav.Screen
              name='QR'
              component={QrStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='home'
                    color={props.color}
                    {...iconProps}
                  />
                )
              }}
            /> */}

            <Nav.Screen
              name='Transactie Geschiedenis'
              component={TransactionHistoryStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='history'
                    color={props.color}
                    {...iconProps}
                  />
                )
              }}
            />

            {/* <Nav.Screen
              name='Bijdrage Geschiedenis'
              component={ContributionHistoryStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='swap-vertical-circle'
                    color={props.color}
                     {...iconProps}
                  />
                )
              }}
            /> */}

            {/* <Nav.Screen
              name='Betalingsopdrachten'
              component={StandingOrderStack}
              options={{
                drawerIcon: props => (
                  <MaterialIcons
                    name='loop'
                    color={props.color}
                     {...iconProps}
                  />
                )
              }}
            /> */}

            {/* <Nav.Screen
              name='Beheer Vrije Buffer'
              component={FreeBufferStack}
              options={{
                drawerIcon: props => (
                  <Entypo
                    name='bar-graph'
                    color={props.color}
                     {...iconProps}
                  />
                )
              }}
            /> */}

            {/* <Nav.Screen
              name='Contacten'
              component={ContactListStack}
              options={{
                drawerIcon: props => (
                  <MaterialCommunityIcons
                    name='contacts'
                    color={props.color}
                     {...iconProps}
                  />
                )
              }}
            /> */}

            <Nav.Screen
              name='Account'
              component={AccountStack}
              options={({ focused, color }) => (
                <MaterialCommunityIcons
                  name='account-circle'
                  color={color}
                  {...iconProps}
                />
              )}
            />
          </Nav.Navigator>
        </NavigationContainer>
      </View>
    )
  } else {
    return null
  }
}
