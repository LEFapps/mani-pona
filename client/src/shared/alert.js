import { Platform, Alert } from 'react-native'
import log from 'loglevel'

const web = (title, msg, btns) => {
  log.debug('ALERT web:', msg)
  const content = (title || '') + (!!title && !!msg ? '\n\n' : '') + (msg || '')
  alert(content)
}

const native = (title, msg, btns) => {
  log.debug('ALERT native:', msg)
  Alert.alert(title, msg, btns)
}

export const universalAlert = {
  alert: ['ios', 'android'].includes(Platform.OS) ? native : web
}

export default universalAlert
