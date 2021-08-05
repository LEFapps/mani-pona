import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SignIn from '../../screens/auth/signIn';
import NewPassRequired from '../../screens/auth/newPassRequired';

import Header from '../../shared/header';

const AuthStack = createStackNavigator();

const authStack = (props) => {
	if (props.authState === 'signIn') {
		return (
			<AuthStack.Navigator
				initialRouteName="SignIn"
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
				<AuthStack.Screen
					name="SignIn"
					component={SignIn}
					options={() => ({
						headerTitle: () => <Header title="Log In" />
					})}
				/>

				<AuthStack.Screen
					name="NewPassRequired"
					component={NewPassRequired}
					options={() => ({
						headerTitle: () => <Header title="Nieuw Wachtwoord" />
					})}
				/>
			</AuthStack.Navigator>
		);
	} else {
		return null;
	}
};

export default authStack;
