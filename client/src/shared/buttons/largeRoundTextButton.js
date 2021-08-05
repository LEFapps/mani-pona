import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { colors } from '../../helpers/helper';
const { TransparentBlue } = colors;

export default function RoundIconButton(props) {
	return (
		<View style={styles.everything}>
			<TouchableOpacity onPress={props.onPress}>
				<View style={styles.button}>
					<Text style={styles.buttonText}>{props.text}</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	everything: {
		width: '30%',
		alignItems: 'center'
	},
	button: {
		backgroundColor: TransparentBlue,
		borderRadius: 150,
		width: 300,
		height: 300,
		paddingVertical: 100,
		paddingHorizontal: 3,
		marginVertical: 60,
		justifyContent: 'center',
		alignItems: 'center'
	},
	buttonText: {
		fontSize: 22,
		textAlign: 'center',
		color: 'white'
	}
});
