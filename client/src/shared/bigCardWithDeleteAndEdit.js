import React from 'react';
import { StyleSheet, View } from 'react-native';
import IconButtton from './buttons/iconButton';
import { colors } from '../helpers/helper';
const { TransparentBlueCard } = colors;

export default function Card(props) {
	return (
		<View style={styles.card}>
			<View style={styles.cardValues}>{props.children}</View>
			<View style={styles.buttonContainer}>
				<View style={styles.button}>
					<IconButtton iconName="delete" iconColor="white" onPress={props.onPressDelete} />
				</View>
				<View style={styles.button}>
					<IconButtton iconName="edit" iconColor="white" onPress={props.onPressEdit} />
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		padding: 10,
		borderRadius: 5,
		backgroundColor: TransparentBlueCard,
		marginBottom: 5
	},
	cardValues: {
		fontSize: 23,
		marginBottom: 8,
		marginHorizontal: 8
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	button: {
		width: '49%'
	}
});
