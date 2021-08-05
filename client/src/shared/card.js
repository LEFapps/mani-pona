import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../helpers/helper';
const { DarkerBlue } = colors;

export default function Card(props) {
	return (
		<View style={styles.card}>
			<View style={styles.cardContent}>{props.children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderBottomWidth: 1,
		borderBottomColor: DarkerBlue
	},
	cardContent: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginHorizontal: 18,
		marginVertical: 15
	}
});
