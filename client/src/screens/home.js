import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import RoundButton from '../shared/buttons/roundIconButton';
import Camera from '../shared/camera';

export default function Home({ navigation }) {
	return (
		<View>
			<Camera
				onBarCodeScanned={(type, data) => navigation.navigate('AddContact', { type: type, data: data })}
				text="Scan een QR-Code om te betalen of te ontvangen."
			/>

			<View style={styles.buttonContainer}>
				<RoundButton text="QR-Code" logoName="credit-card" onPress={() => navigation.navigate('QRCode')} />
				<RoundButton
					text="Overzicht"
					logoName="dashboard"
					onPress={() => navigation.navigate('AccountBalance')}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	buttonContainer: {
		flexDirection: 'row',
		width: Dimensions.get('screen').width,
		justifyContent: 'space-evenly',
		position: 'absolute',
		bottom: 40
	}
});
