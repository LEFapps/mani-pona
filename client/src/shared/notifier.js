import React, { useContext, useEffect } from 'react'
import { useQuery } from '@apollo/client'

import { navigate } from '../helpers/navigator'

import { NOTIFIERS } from '../../apollo/queries'
import { NotificationContext } from './notifications'

const pollInterval = 2000 // 2 sec // maybe make dynamic upon activity in the app???

const convertNotification = ({ entry, value }) => {
  const notifications = {
    '/current': {
      confirm: {
        title: 'Betaling afgerond',
        message: 'De betaling is afgerond. De munten werden uitgewisseld.',
        type: 'success',
        redirect: ['Startscherm', { screen: 'AccountBalance' }]
      },
      cancel: {
        title: 'Betaling geannuleerd',
        message:
          'De betaling is afgebroken. Er werden geen munten uitgewisseld.',
        type: 'warning',
        redirect: ['Startscherm', { screen: 'AccountBalance' }]
      }
    },
    pending: {
      create: {
        title: 'Betalingsverzoek',
        message: 'Er werd een betalingsverzoek gemaakt.',
        type: 'info',
        redirect: ['Openstaande betalingen']
      },
      forceSystemPayment: {
        title: 'Betalingsverzoek',
        message:
          'Er werd een betalingsverzoek gemaakt door het systeem. Je moet dit eerst accepteren voor je munten kan uitwisselen.',
        type: 'info',
        redirect: ['Openstaande betalingen']
      }
    }
  }
  const defaultNotification = {
    title: entry || 'Melding',
    message: value || 'Er gebeurde iets, maar ik weet niet wat.',
    type: 'info'
  }
  return (notifications[entry] && notifications[entry][value]) || false
}

export const Notifier = () => {
  const { maniClient } = global
  const { add } = useContext(NotificationContext)
  const { loading, error, data } = useQuery(NOTIFIERS, {
    variables: { id: maniClient.id },
    pollInterval
  })
  useEffect(() => {
    if (!loading && data && data.ledger.notifications) {
      data.ledger.notifications
        .map(convertNotification)
        .filter(n => n)
        .forEach(({ redirect, ...notification }, i) => {
          const buttons = []
          buttons.push({ label: 'Ok' })
          if (redirect) {
            buttons.push({
              onPress: () => navigate(...redirect),
              label: 'Bekijken'
            })
          }
          // timeout is needed here for state to update inbetween
          setTimeout(() => add({ ...notification, buttons }), 100 * i)
        })
    }
  }, [loading, data])
  return null
}
