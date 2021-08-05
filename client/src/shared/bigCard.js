import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../helpers/helper';
const { DarkerBlue, TransparentBlueCard } = colors;

export default function Card(props) {
	return (
		<View style={styles.card}>
			<View style={styles.cardValues}>{props.children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 10,
		borderRadius: 5,
		borderBottomColor: DarkerBlue,
		backgroundColor: TransparentBlueCard,
		marginBottom: 5
	},
	cardValues: {
		fontSize: 23,
		marginBottom: 8,
		marginHorizontal: 8
	}
});
