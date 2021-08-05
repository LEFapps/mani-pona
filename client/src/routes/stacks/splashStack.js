import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import Splash from '../../screens/splash';
import AuthStack from '../../routes/stacks/authStack';
import Drawer from '../../routes/drawer';

const SplashStack = createStackNavigator();

const splashStack = () => {
	return (
		<SplashStack.Navigator
			initialRouteName="Splash"
			screenOptions={{
				headerShown: false
			}}
		>
			<SplashStack.Screen name="Splash" component={Splash} />
			<SplashStack.Screen name="Drawer" component={Drawer} />
			<SplashStack.Screen name="AuthStack" component={AuthStack} />
		</SplashStack.Navigator>
	);
};

export default splashStack;
