import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef
} from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native-web'
import { hash } from '../../shared/crypto'

import { colors } from '../helpers/helper'

/**
 * NOTIFICATION HANDLER
 *
 * How to use:
 *
 * 1 wrap your app in NotificationProvider
 *
 * 2 use in component:
 * const notification = useNotifications()
 * notficiation.add({...props})
 *
 * props for add()
 * @param title (String)
 * @param message (String)
 * @param buttons ([Object]): {onPress(), label}
 * @param type (String): info | danger | warning | success
 *
 */

const visible = 8000 // 8 sec

export const NotificationContext = createContext({
  add: () => {}
})

export const useNotifications = () => {
  return useContext(NotificationContext)
}

export const Notification = ({
  title,
  message,
  buttons = [],
  type = 'info',
  onHide,
  id
}) => {
  useEffect(() => {
    if (!buttons.length) {
      setTimeout(() => onHide(id), visible)
    }
  }, [id])
  const titleStyle = StyleSheet.compose(style.title, style[type] || style.info)
  return (
    <View style={style.alert}>
      {title && <Text style={titleStyle}>{title}</Text>}
      {message && <Text style={style.message}>{message}</Text>}
      {!!buttons.length && (
        <View style={style.buttons}>
          {buttons.map(({ onPress, label, text }, key) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                onPress && onPress()
                onHide(id)
              }}
              style={style.button}
            >
              <Text style={StyleSheet.compose(style.buttonText, style[type])}>
                {label || text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

export const Notifications = ({ notifications, onRemove }) => {
  return (
    <View style={style.alertContainer}>
      {notifications.map(({ id, ...notification }) => (
        <Notification key={id} id={id} {...notification} onHide={onRemove} />
      ))}
    </View>
  )
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const notificationsRef = useRef(notifications)
  notificationsRef.current = notifications

  const add = n => {
    const notification = { ...n, id: hash() }
    setNotifications([...notificationsRef.current, notification])
  }

  const removeNotification = key => {
    const updated = [...notificationsRef.current]
    const removeIndex = updated.findIndex(({ id }) => id === key)
    if (removeIndex >= 0) updated.splice(removeIndex, 1)
    setNotifications(updated)
  }

  return (
    <NotificationContext.Provider value={{ add }}>
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
    top: 16,
    left: 16,
    right: 16,
    zIndex: 666,
    display: 'flex',
    flexDirection: 'column'
  },
  alert: {
    marginTop: 16,
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
    alignSelf: 'flex-end',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  button: {
    flex: '0 0 auto',
    marginLeft: 8,
    padding: 4
  },
  buttonText: {
    color: colors.LoREcoBlue,
    textTransform: 'upperCase',
    fontWeight: 'bold'
  }
})
