import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { colors } from '../../helpers/helper';
const { DarkerBlue } = colors;

export default function FlatButton(props) {
	return (
		<View style={styles.everything}>
			<TouchableOpacity onPress={props.onPressAll} style={styles.touchableAll}>
				<View style={{ backgroundColor: props.allBackground, borderRadius: 4, paddingVertical: 4 }}>
					<Text style={styles.buttonText}>Alle</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity onPress={props.onPressPayd} style={styles.touchablePayd}>
				<View style={{ backgroundColor: props.paydBackground, borderRadius: 4, paddingVertical: 4 }}>
					<Text style={styles.buttonText}>Betaald</Text>
				</View>
			</TouchableOpacity>
			<TouchableOpacity onPress={props.onPressReceived} style={styles.touchableReceived}>
				<View style={{ backgroundColor: props.receivedBackground, borderRadius: 4, paddingVertical: 4 }}>
					<Text style={styles.buttonText}>Ontvangen</Text>
				</View>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	everything: {
		borderRadius: 6,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: DarkerBlue,
		paddingVertical: 2
	},
	touchableAll: {
		width: '33%',
		fontSize: 25,
		textAlign: 'center'
	},
	touchablePayd: {
		width: '33%',
		fontSize: 16,
		textAlign: 'center'
	},
	touchableReceived: {
		width: '33%',
		textAlign: 'center'
	},
	buttonText: {
		borderRadius: 4,
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center'
	}
});
