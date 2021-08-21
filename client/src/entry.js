import { registerRootComponent } from 'expo'
import App from '../App'
import log from 'loglevel'

log.enableAll()
log.debug('Registering root component')
registerRootComponent(App)
log.debug('Root component registered')
