import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useIsFocused } from '@react-navigation/native'

import StandingOrder from '../../screens/standingOrders'
import AddStandingOrder from '../../screens/addStandingOrder'
import EditStandingOrder from '../../screens/editStandingOrder'
import CamToAddStandingOrder from '../../screens/camToAddStandingOrder'
import Header from '../../shared/header'

const StandingOrderStack = createStackNavigator()

const standingOrderStack = () => {
  const isFocused = useIsFocused()
  return (
    isFocused && (
      <StandingOrderStack.Navigator
        initialRouteName='StandingOrder'
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
        <StandingOrderStack.Screen
          name='StandingOrder'
          component={StandingOrder}
          options={() => ({
            headerTitle: () => (
              <Header title='Openstaande betalingen' icon='menu' />
            )
          })}
        />

        {/* <StandingOrderStack.Screen
				name="AddStandingOrder"
				component={AddStandingOrder}
				options={{ title: 'Toevoegen', headerBackTitle: 'Terug' }}
			/>

			<StandingOrderStack.Screen
				name="EditStandingOrder"
				component={EditStandingOrder}
				options={{ title: 'Bewerken', headerBackTitle: 'Annuleren' }}
			/>
			<StandingOrderStack.Screen
				name="CamToAddStandingOrder"
				component={CamToAddStandingOrder}
				options={{ title: 'Scan QR-Code', headerBackTitle: 'Annuleren' }}
			/> */}
      </StandingOrderStack.Navigator>
    )
  )
}

export default standingOrderStack
