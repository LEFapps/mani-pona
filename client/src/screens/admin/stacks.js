import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import DashboardScreen from './Dashboard'
import ParametersScreen from './Parameters'
import UsersScreen from './Users'

const DashboardStack = createStackNavigator()
const ParametersStack = createStackNavigator()
const UsersStack = createStackNavigator()

export const Dashboard = () => {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen name='dashboard' component={DashboardScreen} />
    </DashboardStack.Navigator>
  )
}

export const Parameters = () => {
  return (
    <ParametersStack.Navigator>
      <ParametersStack.Screen name='parameters' component={ParametersScreen} />
    </ParametersStack.Navigator>
  )
}

export const Users = () => {
  return (
    <UsersStack.Navigator>
      <UsersStack.Screen name='users' component={UsersScreen} />
    </UsersStack.Navigator>
  )
}
