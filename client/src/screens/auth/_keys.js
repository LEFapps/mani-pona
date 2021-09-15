import React, { Fragment, useState } from 'react'
import { Modal, Button, TextInput, Text, View } from 'react-native'

import CustomButton from '../../shared/buttons/button'
import { globalStyles } from '../../styles/global'

const ExportKeys = () => {
  const { maniClient } = global
  const [hasKeys, setKeys] = useState()
  const [isBusy, setBusy] = useState()
  const getKeys = async () => {
    setBusy(true)
    maniClient.exposeKeys().then(({ privateKeyArmored, publicKeyArmored }) => {
      setKeys(`${privateKeyArmored}\n\n${publicKeyArmored}`)
      setBusy(false)
    })
  }

  return (
    <View>
      <CustomButton
        text={isBusy ? 'Sleutels verzamelen . . .' : 'Exporteer mijn sleutels'}
        onPress={getKeys}
      />
      {!!hasKeys && (
        <View>
          <Text style={globalStyles.text}>
            Kopieer onderstaande sleutels naar een veilige plek. Je hebt ze
            nodig om correct te kunnen aanmelden op een ander toestel of wanneer
            een andere gebruiker dit toestel gebruikt heeft.
          </Text>
          <TextInput
            value={hasKeys || ''}
            style={{ width: '100%', height: '50vh', marginVertical: 2 }}
            multiline
          />
        </View>
      )}
    </View>
  )
}

export default ExportKeys
