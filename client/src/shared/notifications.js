import React, { createContext, useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native-web'
import { colors } from '../helpers/helper'

/**
 * NOTIFICATION HANDLER
 *
 * How to use:
 *
 * 1 wrap your app in NotificationProvider
 *
 * 2 use in component:
 * const notification = useContext(NotificationContext)
 * notficiation.add({...props})
 *
 * props for add()
 * @param title (String)
 * @param message (String)
 * @param buttons ([Object]): {onPress(), label}
 * @param type (String): info | danger | warning | success
 *
 */

export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {}
})

export const Notification = ({
  title,
  message,
  buttons = [],
  type = 'info',
  visible,
  onHide
}) => {
  useEffect(() => {
    if (!buttons.length) setTimeout(onHide, 5000)
  })
  const titleStyle = StyleSheet.compose(style.title, style[type] || style.info)
  return (
    visible && (
      <View style={style.alertContainer}>
        {title && <Text style={titleStyle}>{title}</Text>}
        {message && <Text style={style.message}>{message}</Text>}
        {!!buttons.length && (
          <View style={style.buttons}>
            {buttons.map(({ onPress, label, text }, key) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  onPress && onPress()
                  onHide()
                }}
                style={style.button}
              >
                <Text>{label || text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  )
}

export const Notifications = ({ notifications, onRemove }) => {
  return (
    <View>
      {notifications.map((not, key) => (
        <Notification key={key} {...not} onHide={() => onRemove(key)} />
      ))}
    </View>
  )
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const addNotification = n =>
    setNotifications([
      ...notifications.filter(({ visible }) => !!visible),
      { ...n, visible: true }
    ])
  const removeNotification = key =>
    setNotifications(
      notifications.slice(0, key - 1).concat(notifications.slice(key + 1))
    )
  return (
    <NotificationContext.Provider value={{ add: addNotification }}>
      {children}
      <Notifications
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

const style = StyleSheet.create({
  alertContainer: {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    boxShadow: '0 6px 12px rgba(0,0,0,.4)'
  },
  title: {
    marginBottom: 8,
    color: colors.DarkerBlue,
    fontSize: 16,
    fontWeight: 'bold'
  },
  info: { color: colors.DarkerBlue },
  danger: { color: colors.ErrorRed },
  warning: { color: colors.Warning },
  success: { color: colors.Success },
  message: {
    color: '#000',
    fontSize: 16
  },
  buttons: {
    marginTop: 8,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    flex: '0 0 auto',
    marginLeft: 8,
    padding: 4,
    color: colors.LoREcoBlue,
    textTransform: 'upperCase',
    fontWeight: 'bold'
  }
})
