import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'

export const Contact = ({ ledger, ...props }) => {
  const defaultAlias = ledger.slice(0, 6) + (ledger.length > 6 ? '...' : '')
  const [getAlias, setAlias] = useState()
  const { maniClient } = global

  useEffect(() => {
    ledger !== 'system' &&
      maniClient
        .find(ledger)
        .then(setAlias)
        .catch(() => {
          setAlias('anonymous')
        })
  })

  return (
    <Text {...props}>
      {ledger === 'system' ? 'Systeembeheerder' : getAlias}
    </Text>
  )
}
