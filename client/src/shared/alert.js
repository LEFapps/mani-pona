import { Platform, Alert } from 'react-native'
import log from 'loglevel'

const web = msg => {
  log.debug('ALERT web:', msg)
  alert(msg)
}

const native = msg => {
  log.debug('ALERT native:', msg)
  Alert.alert(msg)
}

export const universalAlert = {
  alert: ['ios', 'android'].includes(Platform.OS) ? native : web
}

export default universalAlert
