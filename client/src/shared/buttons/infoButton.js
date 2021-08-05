import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../helpers/helper';
const { DarkerBlue } = colors;

export default function RoundIconButton(props) {
	return (
		<View style={styles.everything}>
			<TouchableOpacity onPress={props.onPress}>
				<MaterialIcons name={props.logoName} size={props.size} style={styles.buttonLogo} />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	everything: {
		width: '30%',
		alignItems: 'center'
	},

	buttonLogo: {
		color: DarkerBlue,
		textAlign: 'center'
	}
});
