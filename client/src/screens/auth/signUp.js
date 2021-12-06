import React, { useContext, useState } from 'react'
import { TextInput, View, Text, ScrollView } from 'react-native'
import Auth from '@aws-amplify/auth'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import FlatButton from '../../shared/buttons/historyButton.js'
import {
  validateEmail,
  validatePassword,
  validatePasswordRepeat,
  validateNotEmpty,
  validateRegex
} from '../../helpers/validation'
import { useNotifications } from '../../shared/notifications'
import i18n from 'i18n-js'
import { resetClient } from '../../../App.js'
import AccountsList from './_accounts.js'

export default function signUp (props) {
  const defaultState = {
    alias: '',
    email: '',
    password: '',
    password2: '',
    requestedType: 'default',
    privacy: 0,
    address: '',
    zip: '',
    city: '',
    phone: '',
    birthday: '',
    companyTaxNumber: ''
  }

  const [isBusy, setBusy] = useState(false)
  const [state, setState] = useState(defaultState)
  const [errors, setErrors] = useState(defaultState)
  const notification = useNotifications()

  const selectAccount = (username, key) => {
    if (key) props.onStateChange('signIn', { username, key })
    else {
      if (username === 'new') props.onStateChange('signUp')
      if (username === 'import') props.onStateChange('signIn', { prompt: true })
      if (username === 'verify') props.onStateChange('confirmSignUp')
    }
  }

  async function onSubmit () {
    if (isBusy) return
    const emailError = validateEmail(state.email)
    const passwordError =
      validatePassword(state.password) ||
      validatePasswordRepeat(state.password, state.password2)
    const privacyError = validateNotEmpty(state.privacy)
    const aliasError = validateNotEmpty(!!state.alias)
    const addressError = validateNotEmpty(!!state.address)
    const zipError = validateNotEmpty(!!state.zip)
    const cityError = validateNotEmpty(!!state.city)
    const phoneError = validateNotEmpty(!!state.phone)
    const dateError =
      state.requestedType === 'professional'
        ? false
        : validateNotEmpty(!!state.birthday) ||
          validateRegex(state.birthday, 'dateBE')
    const taxError =
      state.requestedType === 'professional'
        ? validateNotEmpty(!!state.companyTaxNumber)
        : false

    if (
      emailError ||
      passwordError ||
      privacyError ||
      aliasError ||
      dateError ||
      addressError ||
      zipError ||
      cityError ||
      phoneError ||
      taxError
    ) {
      setErrors({
        email: emailError,
        password: passwordError,
        privacy: privacyError,
        alias: aliasError,
        birthday: dateError,
        address: addressError,
        zip: zipError,
        city: cityError,
        phone: phoneError,
        companyTaxNumber: taxError
      })
    } else {
      setBusy(true)
      try {
        await resetClient()
        const { userConfirmed } = await Auth.signUp({
          username: state.email,
          password: state.password,
          attributes: {
            'custom:requestedType': state.requestedType,
            'custom:alias': state.alias,
            email: state.email,
            'custom:privacy': !!state.privacy ? '1' : '0',
            address: state.address || '',
            'custom:zip': state.zip || '',
            'custom:city': state.city || '',
            'custom:phone': state.phone || '',
            'custom:birthday': state.birthday || '',
            'custom:companyTaxNumber': state.companyTaxNumber || ''
          }
        })
        if (userConfirmed) {
          props.onStateChange('signIn', { username: state.email })
          notification.add({
            type: 'success',
            title: 'Welkom!',
            message: 'Je registratie is gelukt, je kan je nu aanmelden.'
          })
        } else {
          props.onStateChange('confirmSignUp', { username: state.email })
          notification.add({
            type: 'success',
            title: 'Welkom!',
            message:
              'Je registratie is gelukt, verifieer je e-mailadres nu met de code die je ontvangen hebt via e-mail.'
          })
        }
        setState(defaultState)
        setBusy(false)
      } catch (e) {
        setBusy(false)
        console.error('signUp', e)
        notification.add({
          type: 'danger',
          title: 'Registratie mislukt',
          message: e && e.message
        })
      }
    }
  }

  const accountTypes = [
    {
      title: 'Particulier account',
      onPress: () => {
        setState({ ...state, requestedType: 'default' })
        setErrors({ ...errors, companyTaxNumber: false })
      },
      active: () => state.requestedType === 'default'
    },
    {
      title: 'Professioneel account',
      onPress: () => {
        setState({ ...state, requestedType: 'professional' })
        setErrors({ ...errors, birthday: false })
      },
      active: () => state.requestedType === 'professional'
    }
  ]

  const privacies = [
    {
      title: 'Niet akkoord',
      onPress: () => setState({ ...state, privacy: 0 }),
      active: () => state.privacy === 0
    },
    {
      title: 'Akkoord',
      onPress: () => setState({ ...state, privacy: 1 }),
      active: () => state.privacy === 1
    }
  ]

  if (props.authState === 'signUp') {
    return (
      <ScrollView style={globalStyles.container}>
        <Text style={globalStyles.authTitle}>Registreren</Text>
        <View style={globalStyles.main}>
          <View>
            <Text style={globalStyles.label}>E-mail *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='E-mailadres'
              onChangeText={email => {
                setState({ ...state, email: email.toLowerCase() })
                setErrors({ ...errors, email: '' })
              }}
              value={state.email}
            />

            {!!errors.email && (
              <Text style={globalStyles.errorText}>{errors.email}</Text>
            )}

            <Text style={globalStyles.label}>Wachtwoord *</Text>
            <Text style={globalStyles.helpText}>
              Uw wachtwoord moet minstens 8 tekens bevatten, waarvan 1 cijfer, 1
              hoofdletter, 1 kleine letter en 1 speciaal karakter
            </Text>
            <TextInput
              secureTextEntry={true}
              style={globalStyles.input}
              placeholder='Wachtwoord'
              onChangeText={password => {
                setState({ ...state, password: password })
                setErrors({ ...errors, password: '' })
              }}
              value={state.password}
            />

            {!!errors.password && (
              <Text style={globalStyles.errorText}>{errors.password}</Text>
            )}

            <Text style={globalStyles.label}>Herhaal wachtwoord *</Text>
            <TextInput
              secureTextEntry={true}
              style={globalStyles.input}
              placeholder='Herhaal wachtwoord'
              onChangeText={password2 => {
                setState({ ...state, password2 })
                setErrors({ ...errors, password2: '' })
              }}
              value={state.password2}
            />

            {!!errors.password2 && (
              <Text style={globalStyles.errorText}>{errors.password2}</Text>
            )}

            <Text style={globalStyles.label}>Account Type *</Text>
            <FlatButton options={accountTypes} />

            <Text style={globalStyles.label}>
              {state.requestedType === 'professional'
                ? 'Bedrijf of organisatie'
                : 'Naam'}{' '}
              *
            </Text>
            <TextInput
              style={globalStyles.input}
              placeholder={
                state.requestedType === 'professional'
                  ? 'Bedrijfsnaam'
                  : 'Voornaam en Naam'
              }
              onChangeText={alias => {
                setState({ ...state, alias })
                setErrors({ ...errors, alias: '' })
              }}
              value={state.alias}
            />

            {!!errors.alias && (
              <Text style={globalStyles.errorText}>{errors.alias}</Text>
            )}

            <Text style={globalStyles.label}>Adres *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='Straat + nr.'
              onChangeText={address => {
                setState({ ...state, address })
                setErrors({ ...errors, address: '' })
              }}
              value={state.address}
            />

            {!!errors.address && (
              <Text style={globalStyles.errorText}>{errors.address}</Text>
            )}

            <Text style={globalStyles.label}>Postcode *</Text>
            <TextInput
              style={globalStyles.input}
              onChangeText={zip => {
                setState({ ...state, zip })
                setErrors({ ...errors, zip: '' })
              }}
              value={state.zip}
            />

            {!!errors.zip && (
              <Text style={globalStyles.errorText}>{errors.zip}</Text>
            )}

            <Text style={globalStyles.label}>Gemeente *</Text>
            <TextInput
              style={globalStyles.input}
              onChangeText={city => {
                setState({ ...state, city })
                setErrors({ ...errors, city: '' })
              }}
              value={state.city}
            />

            {!!errors.city && (
              <Text style={globalStyles.errorText}>{errors.city}</Text>
            )}

            <Text style={globalStyles.label}>Telefoonnr. *</Text>
            <TextInput
              style={globalStyles.input}
              placeholder='0400 00 00 00'
              onChangeText={phone => {
                setState({ ...state, phone })
                setErrors({ ...errors, phone: '' })
              }}
              value={state.phone}
            />

            {!!errors.phone && (
              <Text style={globalStyles.errorText}>{errors.phone}</Text>
            )}

            {state.requestedType !== 'professional' && (
              <View>
                <Text style={globalStyles.label}>
                  {state.requestedType === 'professional'
                    ? 'Datum oprichting *'
                    : 'Geboortedatum *'}
                </Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder='DD/MM/JJJJ'
                  onChangeText={birthday => {
                    setState({ ...state, birthday })
                    setErrors({ ...errors, birthday: '' })
                  }}
                  value={state.birthday}
                />

                {!!errors.birthday && (
                  <Text style={globalStyles.errorText}>{errors.birthday}</Text>
                )}
              </View>
            )}

            {state.requestedType === 'professional' && (
              <View>
                <Text style={globalStyles.label}>Onderneminsgnr. *</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder='BE0.000.000.000'
                  onChangeText={companyTaxNumber => {
                    setState({ ...state, companyTaxNumber })
                    setErrors({ ...errors, companyTaxNumber: '' })
                  }}
                  value={state.companyTaxNumber}
                />

                {!!errors.companyTaxNumber && (
                  <Text style={globalStyles.errorText}>
                    {errors.companyTaxNumber}
                  </Text>
                )}
              </View>
            )}

            {/* TODO: link to pdf with privacy statement */}
            <Text style={globalStyles.label}>
              Ik accepteer de{' '}
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Privacy_Klavers_Lichtervelde.docx.pdf'
              >
                Privacyvoorwaarden
              </a>{' '}
              en{' '}
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Algemene_voorwaarden_Klavers_Lichtervelde.docx.pdf'
              >
                Algemene Voorwaarden *
              </a>
            </Text>
            <FlatButton options={privacies} />

            {!!errors.privacy && (
              <Text style={globalStyles.errorText}>{errors.privacy}</Text>
            )}

            <Button
              text={isBusy ? '• • •' : 'Registreren'}
              onPress={onSubmit}
            />
          </View>
          <AccountsList onSelect={selectAccount} />
        </View>
      </ScrollView>
    )
  } else {
    return null
  }
}
