import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ContactList from '../../screens/contacts';
import Header from '../../shared/header';
import Transaction from '../../screens/transactionFromContacts';

const ContactListStack = createStackNavigator();

const contactListStack = () => {
	return (
		<ContactListStack.Navigator
			initialRouteName="ContactList"
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
			<ContactListStack.Screen
				name="ContactList"
				component={ContactList}
				options={() => ({
					headerTitle: () => <Header title="Contacten" icon="menu" />
				})}
			/>

			<ContactListStack.Screen
				name="Transaction"
				component={Transaction}
				options={{ title: 'Transactie', headerBackTitle: 'Terug' }}
			/>
		</ContactListStack.Navigator>
	);
};

export default contactListStack;
