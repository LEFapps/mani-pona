import Storage from 'dom-storage'
import log from 'loglevel'
/**
 * For demonstration: we fake a LocalStorage such a what you'd find in a browser.
 */
const KeyStorage = (path = './.manipona.keys.json') => {
  const localStorage = new Storage(path, { strict: false })
  return {
    getKeys () {
      const keys = localStorage.getItem('pk')
      if (keys) log.info(`Keys found for ledger ${keys.ledger}`)
      return keys
    },
    saveKeys ({ ledger, publicKeyArmored, privateKeyArmored }) {
      localStorage.setItem('pk', { ledger, publicKeyArmored, privateKeyArmored })
    }
  }
}

export default KeyStorage
