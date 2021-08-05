import React, { useState } from 'react';

import { View, Text, TextInput } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';

import Button from '../shared/buttons/button';
import PayOrReceiveButton from '../shared/buttons/payOrReceiveButton';

import { globalStyles } from '../styles/global.js';

const reviewSchema = yup.object({
	amount: yup.number().required('Oeps, dit veld is verplicht!')
});

export default function Transaction(props) {
	const [ Background, setBackground ] = useState({ payd: 'white', received: 'transparent' });
	const [ payOrReceive, setPayOrReceive ] = useState('pay');

	const showScreen = (value) => {
		if (value == 'pay') {
			setBackground({ payd: 'white', received: 'transparent' });
			setPayOrReceive('pay');
		} else if ('receive') {
			setBackground({ payd: 'transparent', received: 'white' });
			setPayOrReceive('receive');
		}
	};

	return (
		<View style={globalStyles.main}>
			<PayOrReceiveButton
				onPressPayd={() => showScreen('pay')}
				onPressReceived={() => showScreen('received')}
				allBackground={Background.all}
				paydBackground={Background.payd}
				receivedBackground={Background.received}
			/>
			<Formik
				initialValues={{
					amount: '',
					msg: ''
				}}
				validationSchema={reviewSchema}
				onSubmit={(values, actions) => {
					if (payOrReceive === 'pay') {
						values.amount = -values.amount;
					}
					props.onSubmit(values, actions);
				}}
			>
				{(props) => (
					<View>
						<Text style={globalStyles.label}>Geef het bedrag in</Text>

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
							<Text style={globalStyles.errorText}>{props.touched.amount && props.errors.amount}</Text>
						)}

						<Text style={globalStyles.label}>Mededeling(optioneel)</Text>

						<TextInput
							style={globalStyles.input}
							placeholder="Mededeling"
							onChangeText={props.handleChange('msg')}
							onBlur={props.handleBlur('msg')}
							value={props.values.msg}
						/>

						<Button color="maroon" text="Betalen" onPress={props.handleSubmit} />
					</View>
				)}
			</Formik>
		</View>
	);
}
