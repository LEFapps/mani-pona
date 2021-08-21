import React, { useState } from 'react'
import { TextInput, View, Text, Alert } from 'react-native'
import { globalStyles } from '../styles/global.js'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { Formik } from 'formik'
import * as yup from 'yup'
import Button from '../shared/buttons/button'
import { Picker } from '@react-native-picker/picker'
import { dateRegex } from '../helpers/helper'

const reviewSchema = yup.object({
  beneficiary: yup.string().required('Oeps, dit veld is verplicht!'),
  amount: yup.string().required('Oeps, dit veld is verplicht!'),
  endDate: yup
    .string()
    .matches(dateRegex, 'Datum niet correct')
    .required('Oeps, dit veld is verplicht!')
})

export default function AddStandingOrder ({ route, navigation }) {
  const { transactions } = global.maniClient
  const { type, data } = route.params

  const [frequency, setFrequency] = useState('Montly')
  return (
    <KeyboardAwareScrollView>
      <View style={globalStyles.main}>
        <Formik
          initialValues={{
            beneficiary: data,
            amount: '',
            frequency: frequency,
            endDate: '',
            statement: ''
          }}
          validationSchema={reviewSchema}
          onSubmit={({ values }, actions) => {
            actions.resetForm()
            Alert.alert('Niet Geimplementeerd')
            navigation.navigate('StandingOrder')
            //TODO addStandingOrder(values);
          }}
        >
          {props => (
            <View>
              <Text style={globalStyles.label}>Bedrag</Text>
              <TextInput
                style={globalStyles.input}
                placeholder='Bedrag'
                onChangeText={props.handleChange('amount')}
                onBlur={props.handleBlur('amount')}
                value={props.values.amount.toString()}
                keyboardType='numeric'
              />
              {props.touched.amount && props.errors.amount && (
                <Text style={globalStyles.errorText}>
                  {props.touched.amount && props.errors.amount}
                </Text>
              )}

              <Text style={globalStyles.label}>Frequentie</Text>
              <View style={globalStyles.input}>
                <Picker
                  selectedValue={frequency}
                  onValueChange={(itemValue, itemIndex) => {
                    setFrequency(itemValue)
                    props.values.frequency = itemValue
                  }}
                >
                  <Picker.Item label='Dagelijks' value='Dayly' />
                  <Picker.Item label='Wekelijks' value='Weekly' />
                  <Picker.Item label='Maandelijks' value='Montly' />
                  <Picker.Item label='Om de 2 maanden' value='TwoMonths' />
                  <Picker.Item label='Trimestriële' value='Trimestrial' />
                  <Picker.Item label='Om de 4 maanden' value='FourMonths' />
                  <Picker.Item label='Semestriële' value='Semestreil' />
                  <Picker.Item label='Jaarlijks' value='Yearly' />
                </Picker>
              </View>

              <Text style={globalStyles.label}>Eind datum</Text>
              <TextInput
                style={globalStyles.input}
                placeholder='dd/mm/jjjj'
                onChangeText={props.handleChange('endDate')}
                onBlur={props.handleBlur('endDate')}
                value={props.values.endDate}
              />
              {props.touched.endDate && props.errors.endDate && (
                <Text style={globalStyles.errorText}>
                  {props.touched.endDate && props.errors.endDate}
                </Text>
              )}

              <Text style={globalStyles.label}>Mededeling(optioneel)</Text>
              <TextInput
                style={globalStyles.input}
                multiline
                placeholder='Typ je mededeling'
                onChangeText={props.handleChange('statement')}
                onBlur={props.handleBlur('statement')}
                value={props.values.statement}
              />

              <Button text='Bevestigen' onPress={props.handleSubmit} />
            </View>
          )}
        </Formik>
      </View>
    </KeyboardAwareScrollView>
  )
}
