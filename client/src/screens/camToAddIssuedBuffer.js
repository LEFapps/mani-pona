import React from 'react';

import { View } from 'react-native';
import Camera from '../shared/camera';

export default function CamToAddIssuedBuffer({ navigation }) {
	return (
		<View>
			<Camera
				onBarCodeScanned={(type, data) => navigation.navigate('AddIssuedBuffer', { type: type, data: data })}
				text="Scan de QR-Code van de begunstigde"
			/>
		</View>
	);
}
