import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import { globalStyles } from '../styles/global.js';

export default function Splash() {
	return (
		<View style={globalStyles.splash}>
			<Image source={require('../assets/logo_Loreco_csmall.png')} resizeMode="contain" style={{ width: 100 }} />
		</View>
	);
}
