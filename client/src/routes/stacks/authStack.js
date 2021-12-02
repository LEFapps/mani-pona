import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import SignIn from '../../screens/auth/signIn'
import SignUp from '../../screens/auth/signUp'
import NewPassRequired from '../../screens/auth/newPassRequired'

import Header from '../../shared/header'

const AuthStack = createStackNavigator()

const screenOptions = {
  headerStyle: { backgroundColor: '#00a3e4' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
  headerTitleAlign: 'center'
}

const authStack = props => {
  switch (props.authState) {
    case 'signIn':
      return (
        <AuthStack.Navigator
          initialRouteName='SignIn'
          screenOptions={screenOptions}
        >
          <AuthStack.Screen
            name='SignIn'
            component={SignIn}
            options={() => ({
              headerTitle: () => <Header title='Log In' />
            })}
          />

          <AuthStack.Screen
            name='NewPassRequired'
            component={NewPassRequired}
            options={() => ({
              headerTitle: () => <Header title='Nieuw Wachtwoord' />
            })}
          />
        </AuthStack.Navigator>
      )
    case 'signUp':
      return (
        <AuthStack.Navigator
          initialRouteName='SignUp'
          screenOptions={screenOptions}
        >
          <AuthStack.Screen
            name='SignUp'
            component={SignUp}
            options={() => ({
              headerTitle: () => <Header title='Registratie' />
            })}
          />
        </AuthStack.Navigator>
      )
    default:
      return null
  }
}

export default authStack
