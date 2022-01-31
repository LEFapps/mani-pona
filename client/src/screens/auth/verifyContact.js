import React, { useState } from 'react'
import { TextInput, View, Text, ScrollView, Image } from 'react-native'
import Auth from '@aws-amplify/auth'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { globalStyles } from '../../styles/global.js'
import Button from '../../shared/buttons/button'
import { resetClient } from '../../../App'
import { keyWarehouse } from '../../maniClient.js'

const iconProps = {
  size: 16,
  style: { marginRight: 4, marginTop: 1 }
}
const Icon = ({ open }) => (
  <MaterialCommunityIcons
    name={open ? 'arrow-down' : 'arrow-right'}
    {...iconProps}
  />
)

export default function verifyContact ({ authState, authData, onStateChange }) {
  const { storageKey, keyValue, email, ...user } = authData || {}

  const [isBusy, setBusy] = useState(false)
  const [alias, setAlias] = useState(
    (user && user.attributes && user.attributes['custom:alias']) || email
  )
  // const [pin, setPin] = useState('')
  // const [offline, setOffline] = useState(false)
  const [errors, setErrors] = useState([])
  const [toggle, setToggle] = useState(null)

  const onSubmit = async () => {
    setBusy(true)
    if (checkForErrors()) return setBusy(false)

    // init maniClient for account fetching
    let fetchedKey = ''
    if (!storageKey)
      fetchedKey = (
        (await keyWarehouse.list()).find(
          ({ username }) => username === email
        ) || {}
      ).key
    await resetClient({ storageKey: storageKey || fetchedKey })
    const { maniClient } = global
    const r = await maniClient.register(alias)

    // TODO: reset user context after registering
    // the following lines are untested, and probably not necessary
    // the ledger is already set in the maniClient and the user
    // react context is not currently being updated for now
    try {
      const cognitoUser = await Auth.currentAuthenticatedUser()
      const currentSession = await Auth.currentSession()
      cognitoUser.refreshSession(
        currentSession.refreshToken,
        async (err, session) => {
          // do whatever you want to do now :)
          const newCognitoUser = await Auth.currentAuthenticatedUser({
            bypassCache: true
          })
          setBusy(false)
          onStateChange('signedIn', { ...newCognitoUser })
        }
      )
    } catch (e) {
      setBusy(false)
      console.log('Unable to refresh Token', e)
    }
  }

  const checkForErrors = () => {
    const errs = []
    if (!alias.length) errs.push('Alias mag niet leeg zijn.')
    // if (pin.length < 4) errs.push('Pin moet minstens 4 tekens bevatten.')
    setErrors(errs)
    return !!errs.length
  }

  if (authState === 'verifyContact') {
    // add attributes
    // - pin
    // - offline
    // - alias (verify)
    // - keys (hidden)

    return (
      <ScrollView style={globalStyles.container}>
        <View style={globalStyles.main}>
          <Text style={globalStyles.label}>Alias</Text>
          <TextInput
            style={globalStyles.input}
            onChangeText={setAlias}
            defaultValue={alias}
          />

          {/* <Text style={globalStyles.label}>PIN-code (min. 4 cijfers)</Text>
        <TextInput
          style={globalStyles.input}
          onChangeText={setPin}
          placeholder={'****'}
        />

        <Text style={globalStyles.label}>Betalen zonder toestel?</Text>
        <HistoryButton
          options={[
            {
              title: 'Ja, rekening offline beschikbaar',
              active: () => !!offline,
              onPress: () => setOffline(true)
            },
            {
              title: 'Enkel online betalen',
              active: () => !offline,
              onPress: () => setOffline(false)
            }
          ]}
        /> */}

          {!!errors.length &&
            errors.map((e, i) => (
              <Text style={globalStyles.errorText} key={i}>
                {e}
              </Text>
            ))}

          <Button
            text={isBusy ? '• • •' : 'Rekening openen'}
            onPress={onSubmit}
          />
        </View>
        {/* HOWTO */}
        <View style={globalStyles.main}>
          <Text style={globalStyles.label}>Welkom bij Klavers</Text>
          <Text style={globalStyles.subTitleText}>
            Vul hierboven een alias in om aan de slag te gaan met jouw rekening.
          </Text>
        </View>
        <View style={globalStyles.main}>
          <Text style={globalStyles.paragraph}>
            Let op! Je account is gekoppeld aan dit apparaat.
          </Text>
          <Text style={globalStyles.paragraph}>
            Als je dit account ook op een apparaat wilt gebruiken moet je jouw
            geheime sleutels op dat apparaat activeren.
          </Text>
          <Text style={globalStyles.paragraph}>
            Bekijk hieronder de twee mogelijke opties om een account te
            activeren op een nieuw apparaat.
          </Text>
          <Text style={globalStyles.paragraph}>
            Je kan deze informatie na het openen van je rekening ook steeds
            terugvinden op de helppagina.
          </Text>
        </View>
        {/* HOWTO: QR */}
        <View style={globalStyles.main}>
          <Text
            style={globalStyles.cardPropertyText}
            onPress={() => setToggle(toggle !== 1 ? 1 : null)}
          >
            <Icon open={toggle === 1} />
            Rekening overzetten op bijkomend apparaat via QR Code
          </Text>
        </View>
        {toggle === 1 && (
          <View style={globalStyles.main}>
            <Text style={globalStyles.paragraph}>
              Activeer je rekening door hierboven je alias in te geven. Voer
              nadien deze stappen uit:
            </Text>
            <Text style={globalStyles.paragraph}>Op dit apparaat</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op de knop om naar jouw account te gaan
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
              }}
              style={{ height: 60, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Exporteer mijn sleutels'
            </Text>
            <Text style={globalStyles.paragraph}>
              Je ziet nu een scherm met een QR-code, en een menu-balk met de
              optie 'QR-Code 2', deze codes ga je inscannen op je nieuwe
              apparaat.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/2.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>Op het nieuwe apparaat</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op het startscherm op de optie 'Bestaand account
              toevoegen.'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Scan de eerste QR code, wanneer dit gelukt is zie je de knop
              'Volgende stap'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/7.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Navigeer op je ander apparaat naar het scherm met de tweede
              code. Scan de tweede QR code.
            </Text>
            <Text style={globalStyles.paragraph}>
              Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
          </View>
        )}
        {/* HOWTO: manual */}
        <View style={globalStyles.main}>
          <Text
            style={globalStyles.cardPropertyText}
            onPress={() => setToggle(toggle !== 2 ? 2 : null)}
          >
            <Icon open={toggle === 2} />
            Rekening manueel overzetten op bijkomend apparaat
          </Text>
        </View>
        {toggle === 2 && (
          <View style={globalStyles.main}>
            <Text style={globalStyles.paragraph}>
              Activeer je rekening door hierboven je alias in te geven. Voer
              nadien deze stappen uit:
            </Text>
            <Text style={globalStyles.paragraph}>Op dit apparaat:</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op de knop om naar jouw account te gaan
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
              }}
              style={{ height: 60, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Exporteer mijn sleutels'
            </Text>

            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Kopiëren'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/3.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              Je ziet nu een scherm met jouw unieke sleutel. Deze sleutel ga je
              ingeven op je nieuwe apparaat.
            </Text>
            <Text style={globalStyles.paragraph}>
              - Kopieer de sleutel zodat je deze gemakkelijk kunt ingeven op je
              nieuwe apparaat, bijvoorbeeld door deze naar jezelf te mailen.
            </Text>
            <Text style={globalStyles.paragraph}>Op het nieuwe apparaat:</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op het startscherm op de optie 'Bestaand account
              toevoegen.'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>- Klik op 'Plakken'</Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/6.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text>
              Plak je geheime sleutel in het invulveld. Wanneer dit gelukt is
              zie je de knop 'Volgende stap'
            </Text>
            <Text style={globalStyles.paragraph}>
              Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
          </View>
        )}
      </ScrollView>
    )
  }

  return null
}
