import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { createStackNavigator } from '@react-navigation/stack';
import ContributionHistory from '../../screens/contributionHistory';
import Header from '../../shared/header';

const ContributionHistoryStack = createStackNavigator();

const contributionHistoryStack = () => {
	return (
		<ContributionHistoryStack.Navigator
			initialRouteName="ContributionHistory"
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
			<ContributionHistoryStack.Screen
				name="ContributionHistory"
				component={ContributionHistory}
				options={() => ({
					headerTitle: () => <Header title="Bijdrage Geschiedenis" icon="menu" />
				})}
			/>
		</ContributionHistoryStack.Navigator>
	);
};

export default contributionHistoryStack;
