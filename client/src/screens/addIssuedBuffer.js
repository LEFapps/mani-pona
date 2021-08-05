import React from 'react';
import { TextInput, View, Text, Alert } from 'react-native';
import { globalStyles } from '../styles/global.js';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Formik } from 'formik';
import * as yup from 'yup';
import Button from '../shared/buttons/button';
import { dateRegex } from '../helpers/helper';

const reviewSchema = yup.object({
	amount: yup.string().required('Oeps, dit veld is verplicht!'),
	endDate: yup.string().matches(dateRegex, 'Datum niet correct').required('Oeps, dit veld is verplicht!')
});

export default function AddIssuedBuffer({ route, navigation }) {
	const { type, data } = route.params;

	return (
		<KeyboardAwareScrollView>
			<View style={globalStyles.main}>
				<Formik
					initialValues={{
						beneficiary: data,
						amount: '',
						endDate: ''
					}}
					validationSchema={reviewSchema}
					onSubmit={(values, actions) => {
						actions.resetForm();
						Alert.alert('Niet Geimplementeerd');
						navigation.navigate('FreeBuffer');
					}}
				>
					{(props) => (
						<View>
							<Text style={globalStyles.label}>Bedrag</Text>
							<TextInput
								style={globalStyles.input}
								placeholder="Bedrag"
								onChangeText={props.handleChange('amount')}
								onBlur={props.handleBlur('amount')}
								value={props.values.amount.toString()}
								keyboardType="numeric"
							/>
							{props.touched.amount &&
							props.errors.amount && (
								<Text style={globalStyles.errorText}>
									{props.touched.amount && props.errors.amount}
								</Text>
							)}

							<Text style={globalStyles.label}>Eind datum</Text>
							<TextInput
								style={globalStyles.input}
								placeholder="dd/mm/jjjj"
								onChangeText={props.handleChange('endDate')}
								onBlur={props.handleBlur('endDate')}
								value={props.values.endDate}
							/>
							{props.touched.endDate &&
							props.errors.endDate && (
								<Text style={globalStyles.errorText}>
									{props.touched.endDate && props.errors.endDate}
								</Text>
							)}

							<Button text="Bevestigen" onPress={props.handleSubmit} />
						</View>
					)}
				</Formik>
			</View>
		</KeyboardAwareScrollView>
	);
}
