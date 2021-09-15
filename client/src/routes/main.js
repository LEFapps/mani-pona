import React, { useState, useEffect } from 'react'
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { View, Text } from 'react-native'
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons'

import AccountStack from '../routes/stacks/accountStack'
import HomeStack from './stacks/homeStack'
import QrStack from '../routes/stacks/qrStack'
import TransactionHistoryStack from '../routes/stacks/transactionHistoryStack'
import ContributionHistoryStack from '../routes/stacks/contributionHistoryStack'
import StandingOrderStack from '../routes/stacks/standingOrderStack'
// import FreeBufferStack from '../routes/stacks/freeBufferStack'
// import ContactListStack from '../routes/stacks/contactListStack'
import { globalStyles } from '../styles/global'
import { colors } from '../helpers/helper'

const iconProps = { size: 24 }

const screens = ({ Nav }) => ({
  // Overview: (
  //   <Nav.Screen
  //     key='Overview'
  //     name='Overview'
  //     tabBarLabel='Overview'
  //     component={HomeStack}
  //     tabBarIcon={({ focused, color = 'white' }) => (
  //       <MaterialIcons name='home' color={color} {...iconProps} />
  //     )}
  //   />
  // ),
  LoREco: (
    <Nav.Screen
      key='LoREco'
      name='LoREco'
      component={QrStack}
      options={{
        drawerIcon: props => (
          <MaterialIcons name='home' color={props.color} {...iconProps} />
        ),
        tabBarIcon: ({ focused, color = 'white' }) => (
          <MaterialIcons name='home' color={color} {...iconProps} />
        )
      }}
    />
  ),
  Betalingsopdrachten: (
    <Nav.Screen
      key='Betalingsopdrachten'
      name='Betalingsopdrachten'
      component={StandingOrderStack}
      options={{
        drawerIcon: props => (
          <MaterialIcons name='loop' color={props.color} {...iconProps} />
        ),
        tabBarIcon: ({ focused, color = 'white' }) => (
          <MaterialIcons name='loop' color={color} {...iconProps} />
        )
      }}
    />
  ),
  Transacties: (
    <Nav.Screen
      key='Transacties'
      name='Transacties'
      component={TransactionHistoryStack}
      options={{
        drawerIcon: props => (
          <MaterialIcons name='history' color={props.color} {...iconProps} />
        ),
        tabBarIcon: ({ focused, color = 'white' }) => (
          <MaterialIcons name='history' color={color} {...iconProps} />
        )
      }}
    />
  ),
  Bijdragen: (
    <Nav.Screen
      key='Bijdragen'
      name='Bijdragen'
      component={ContributionHistoryStack}
      options={{
        drawerIcon: props => (
          <MaterialIcons
            name='swap-vertical-circle'
            color={props.color}
            {...iconProps}
          />
        ),
        tabBarIcon: ({ focused, color = 'white' }) => (
          <MaterialIcons
            name='swap-vertical-circle'
            color={color}
            {...iconProps}
          />
        )
      }}
    />
  ),
  // 'Beheer Vrije Buffer': (
  //   <Nav.Screen
  //     key='Beheer Vrije Buffer'
  //     name='Beheer Vrije Buffer'
  //     component={FreeBufferStack}
  //     options={{
  //       drawerIcon: props => (
  //         <Entypo name='bar-graph' color={props.color} {...iconProps} />
  //       ),
  // tabBarIcon={({focused, color = 'white'}) => <MaterialIcons name='home' color={color} {...iconProps} />}
  //     }}
  //   />
  // ),
  // Contacten: (
  //   <Nav.Screen
  //     key='Contacten'
  //     name='Contacten'
  //     component={ContactListStack}
  //     options={{
  //       drawerIcon: props => (
  //         <MaterialCommunityIcons
  //           name='contacts'
  //           color={props.color}
  //           {...iconProps}
  //         />
  //       ),
  // tabBarIcon={({focused, color = 'white'}) => <MaterialIcons name='contacts' color={color} {...iconProps} />}
  //     }}
  //   />
  // ),
  Account: (
    <Nav.Screen
      key='Account'
      name='Account'
      component={AccountStack}
      options={{
        tabBarIcon: ({ focused, color = 'white' }) => (
          <MaterialCommunityIcons
            name='account-circle'
            color={color}
            {...iconProps}
          />
        )
      }}
    />
  )
})

export default function drawerNavigator (props) {
  const [hasPending, setPending] = useState(null)
  const [isPolling, setPolling] = useState(null)
  const ManiClient = global.maniClient
  const Nav = createMaterialBottomTabNavigator()
  const navScreens = screens({ Nav })

  useEffect(() => {
    pollPending()
    // return () => {
    //   console.log('cleanup', isPolling)
    //   isPolling && clearInterval(isPolling)
    // }
  })

  const getPending = () => {
    ManiClient.transactions
      .pending()
      .then(pending => {
        console.log('PENDING', pending)
        setPending(pending)
      })
      .catch(e => {
        console.error(e.message)
        setPending(undefined)
      })
  }

  const pollPending = () => {
    if (!isPolling) {
      getPending()
      // const poll = setInterval(() => getPending(), 5000)
      // console.log('init poll', poll)
      // setPolling(poll)
      setPolling(true)
    }
  }

  if (props.authState === 'signedIn') {
    return (
      <View style={globalStyles.container}>
        {hasPending === null ? (
          <Text>Rekening controleren...</Text>
        ) : (
          <NavigationContainer>
            <Nav.Navigator
              barStyle={{ backgroundColor: colors.DarkerBlue }}
              initialRouteName={hasPending ? 'Betalingsopdrachten' : 'LoREco'}
            >
              {Object.keys(navScreens).map(screen => navScreens[screen])}
            </Nav.Navigator>
          </NavigationContainer>
        )}
      </View>
    )
  } else {
    return <View />
  }
}
