import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'
import FreeBuffer from '../../screens/freeBuffer'
import AddIssuedBuffer from '../../screens/addIssuedBuffer'
import EditIssuedBuffer from '../../screens/editIssuedBuffer'
import CamToAddIssuedBuffer from '../../screens/camToAddIssuedBuffer'

import Header from '../../shared/header'

const FreeBufferStack = createStackNavigator()

const homeStack = () => {
  return (
    <FreeBufferStack.Navigator
      initialRouteName='FreeBuffer'
      screenOptions={{
        headerStyle: {
          backgroundColor: '#00a3e4'
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold'
        },
        headerTitleAlign: 'center'
      }}
    >
      <FreeBufferStack.Screen
        name='FreeBuffer'
        component={FreeBuffer}
        options={() => ({
          headerTitle: () => <Header title='Beheer Vrije Buffer' icon='menu' />
        })}
      />

      <FreeBufferStack.Screen
        name='AddIssuedBuffer'
        component={AddIssuedBuffer}
        options={{ title: 'Uitlenen', headerBackTitle: 'Terug' }}
      />

      <FreeBufferStack.Screen
        name='EditIssuedBuffer'
        component={EditIssuedBuffer}
        options={{ title: 'Bewerken', headerBackTitle: 'Annuleren' }}
      />

      <FreeBufferStack.Screen
        name='CamToAddIssuedBuffer'
        component={CamToAddIssuedBuffer}
        options={{ title: 'Scan QR-Code', headerBackTitle: 'Annuleren' }}
      />
    </FreeBufferStack.Navigator>
  )
}

export default homeStack
