import { registerRootComponent } from 'expo'
import App from '../App'
import log from 'loglevel'

log.enableAll()
registerRootComponent(App)
