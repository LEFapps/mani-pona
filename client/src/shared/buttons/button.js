import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { colors } from '../../helpers/helper';
const { DarkerBlue } = colors;

export default function FlatButton(props) {
	return (
		<TouchableOpacity onPress={props.onPress} style={styles.everything}>
			<View style={styles.button}>
				<Text style={styles.buttonText}>{props.text}</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	everything: {
		width: '100%',
		borderRadius: 6,
		paddingHorizontal: 10,
		alignItems: 'center',
		backgroundColor: DarkerBlue,
		elevation: 6,
		marginBottom: 5
	},
	buttonText: {
		marginVertical: 5,
		color: 'white',
		fontSize: 20
	}
});
