import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { globalStyles } from '../styles/global';
import Auth from '@aws-amplify/auth';
import Card from '../shared/card';
import CustomButton from '../shared/buttons/button';

export default function Home() {
	const [ email, setEmail ] = useState('');

	useEffect(() => {
		loadEmailFromUser();
	}, []);

	async function loadEmailFromUser() {
		await Auth.currentSession()
			.then((data) => {
				setEmail(data.idToken.payload['email']);
			})
			.catch((err) => console.log(err));
	}

	async function signOut() {
		try {
			await Auth.signOut({ global: true });
		} catch (error) {
			Alert.alert('error signing out: ', error);
		}
	}

	return (
		<View style={globalStyles.main}>
			<View style={{ marginBottom: 10 }}>
				<Card>
					<Text style={globalStyles.property}>Ingelogd als:</Text>
					<Text style={globalStyles.price}>{email}</Text>
				</Card>
			</View>

			<CustomButton text="Afmelden" onPress={() => signOut()} />
		</View>
	);
}
