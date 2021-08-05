import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../helpers/helper';
const { DarkerBlue } = colors;

export default function RoundIconButton(props) {
	return (
		<View style={styles.everything}>
			<TouchableOpacity onPress={props.onPress}>
				<View style={styles.button}>
					<MaterialIcons name={props.logoName} size={20} style={styles.buttonLogo} />
				</View>
			</TouchableOpacity>
			<Text numberOfLines={1} style={styles.buttonText}>
				{props.text}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	everything: {
		width: '30%',
		alignItems: 'center'
	},
	button: {
		backgroundColor: DarkerBlue,
		borderRadius: 100,
		paddingVertical: 15,
		paddingHorizontal: 15,
		marginVertical: 10
	},
	buttonLogo: {
		fontSize: 20,
		textAlign: 'center',
		color: 'white'
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 14
	}
});
