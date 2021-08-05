import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TransactionHistory from '../../screens/transactionHistory';
import TransactionDetail from '../../screens/transactionDetail';
import Header from '../../shared/header';

const TransactionHistoryStack = createStackNavigator();

const transactionHistoryStack = () => {
	return (
		<TransactionHistoryStack.Navigator
			initialRouteName="TransactionHistory"
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
			<TransactionHistoryStack.Screen
				name="TransactionHistory"
				component={TransactionHistory}
				options={() => ({
					headerTitle: () => <Header title="Transactie Geschiedenis" icon="menu" />
				})}
			/>

			<TransactionHistoryStack.Screen
				name="TransactionDetail"
				component={TransactionDetail}
				options={{ title: 'Transactie Details', headerBackTitle: 'Terug' }}
			/>
		</TransactionHistoryStack.Navigator>
	);
};

export default transactionHistoryStack;
