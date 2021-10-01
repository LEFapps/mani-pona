import React, { useState, useEffect, useContext } from 'react'
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { View, Text } from 'react-native'
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Entypo
} from '@expo/vector-icons'
import Auth from '@aws-amplify/auth'

import { UserContext } from '../authenticator'

import Alert from '../shared/alert'

import AdminStack from './stacks/adminStack'
import AccountStack from '../routes/stacks/accountStack'
import QrStack from '../routes/stacks/qrStack'
import TransactionHistoryStack from '../routes/stacks/transactionHistoryStack'
import ContributionHistoryStack from '../routes/stacks/contributionHistoryStack'
import StandingOrderStack from '../routes/stacks/standingOrderStack'
// import FreeBufferStack from '../routes/stacks/freeBufferStack'
// import ContactListStack from '../routes/stacks/contactListStack'
import { globalStyles } from '../styles/global'
import { colors } from '../helpers/helper'

const iconProps = { size: 24 }

const navScreens = {
  // Overview: {component: ({Nav})=> (
  //   <Nav.Screen
  //     key='Overview'
  //     name='Overview'
  //     tabBarLabel='Overview'
  //     component={HomeStack}
  //     tabBarIcon={({ focused, color = 'white' }) => (
  //       <MaterialIcons name='home' color={color} {...iconProps} />
  //     )}
  //   />
  // )},
  LoREco: {
    component: ({ Nav }) => (
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
    )
  },
  Betalingsopdrachten: {
    component: ({ Nav }) => (
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
    )
  },
  Transacties: {
    component: ({ Nav }) => (
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
    )
  },
  Bijdragen: {
    component: ({ Nav }) => (
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
    )
  },
  // 'Beheer Vrije Buffer': {component: ({Nav})=> (
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
  // )},
  // Contacten: {component: ({Nav})=> (
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
  // )},
  Account: {
    component: ({ Nav }) => (
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
  },
  Admin: {
    onlyVisibleTo: ['administrator'],
    component: ({ Nav }) => (
      <Nav.Screen
        key='Admin'
        name='Admin'
        component={AdminStack}
        options={{
          tabBarIcon: ({ focused, color = 'white' }) => (
            <MaterialCommunityIcons
              name='wrench'
              color={color}
              {...iconProps}
            />
          )
        }}
      />
    )
  }
}

export default function drawerNavigator (props) {
  const { maniClient } = global
  const user = useContext(UserContext)
  const [hasPending, setPending] = useState(null)
  const [isPolling, setPolling] = useState(null)
  const Nav = createMaterialBottomTabNavigator()

  useEffect(() => {
    if (props.authState === 'signedIn') pollPending && pollPending()
  })

  if (props.authState !== 'signedIn' || !user) return <View />

  const pollPending = async () => {
    if (!isPolling) {
      setPolling(true)
      getPending()
    }
  }

  const getPending = async () => {
    // get attributes from Cognito claims
    const { 'custom:ledger': ledger } = user.attributes
    // autoLogout if not signed in correctly,
    // else check for pending transactions
    if (maniClient.id !== ledger) {
      Alert.alert(
        'De sleutels op dit toestel komen niet overeen met het account waarmee je je aangemeld hebt. Je bent terug afgemeld.'
      )
      await Auth.signOut({ global: true })
    } else {
      await maniClient.transactions
        .pending()
        .then(setPending)
        .catch(e => {
          console.error('main/pending', e)
          e && Alert.alert(e.message)
          setPending(undefined)
        })
    }
  }

  const availableScreens = Object.keys(navScreens)
    .map(key => {
      const { onlyVisibleTo } = navScreens[key]
      const check = onlyVisibleTo
        ? onlyVisibleTo.map(role => !!user.attributes[`custom:${role}`])
        : [true]
      return check.includes(true) && key
    })
    .filter(a => a)

  return (
    <View style={globalStyles.container}>
      {hasPending === null ? (
        <View style={globalStyles.main}>
          <Text style={globalStyles.bigText}>
            {!!isPolling && 'Even geduld, we halen je rekening op...'}
          </Text>
        </View>
      ) : (
        <NavigationContainer>
          <Nav.Navigator
            barStyle={{ backgroundColor: colors.DarkerBlue }}
            initialRouteName={hasPending ? 'Betalingsopdrachten' : 'LoREco'}
          >
            {availableScreens.map(screen =>
              navScreens[screen].component({ Nav })
            )}
          </Nav.Navigator>
        </NavigationContainer>
      )}
    </View>
  )
}
