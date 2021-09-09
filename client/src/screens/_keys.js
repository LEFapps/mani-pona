import React, { useState } from 'react'

import CustomButton from '../shared/buttons/button'

const ExportKeys = () => {
  const { maniClient } = global
  const [hasKeys, setKeys] = useState()
  const [isBusy, setBusy] = useState()
  const getKeys = async () => {
    const {
      privateKeyArmored,
      publicKeyArmored
    } = await maniClient.keyManager.getKeys()
    setKeys(`${privateKeyArmored}\n\n${publicKeyArmored}`)
  }

  if (hasKeys && !isBusy)
    return (
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(hasKeys)}
        download={'myKeys-LoREco-' + maniClient.id + '.txt'}
      >
        Sleutels klaar: downloaden
      </a>
    )
  if (!hasKeys)
    return <CustomButton text='Exporteer mijn sleutels' onPress={getKeys} />
  if (!isBusy) return <Text>Gathering keys…</Text>
}

export default ExportKeys
