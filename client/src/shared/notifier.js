import React, { useContext, useEffect } from 'react'
import { useQuery } from '@apollo/client'

import { navigate } from '../helpers/navigator'

import { NOTIFIERS } from '../../apollo/queries'
import { NotificationContext } from './notifications'

const mapNav = entry => {
  const screens = {
    current: 'Startscherm',
    pending: 'Openstaande betalingen',
    recent: 'Transacties'
  }
  return screens[entry] || 'Startscherm'
}

export const Notifier = () => {
  const { maniClient } = global
  const { add } = useContext(NotificationContext)
  const { loading, error, data } = useQuery(NOTIFIERS, {
    variables: { id: maniClient.id },
    pollInterval: 5000
  })
  useEffect(() => {
    if (!loading && data && data.ledger.notifications) {
      console.log(data.ledger.notifications.length)
      data.ledger.notifications.forEach(({ redirect, ...notification }, i) => {
        const buttons = [
          {
            onPress: () => redirect && navigate(mapNav(redirect)),
            label: redirect ? 'Bekijken' : 'Ok'
          }
        ]
        // timeout is needed here for state to update inbetween
        setTimeout(() => add({ ...notification, buttons }), 100 * i)
      })
    }
  }, [loading, data])
  return null
}
