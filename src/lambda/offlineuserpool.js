import fs from 'fs'
import log from 'loglevel'

/**
 * For offline development only!
 *
 * Expected format of user records:
 *
 * { ledger: '<fingerprint>'}
 */
const OfflineUserPool = (path = '.jubilee.users.json') => {
  const contents = fs.readFileSync(path, { encoding: 'utf-8' })
  if (!contents) console.log(`Please make sure ${path} is present`)
  const jubilee = JSON.parse(contents)
  log.info(`Loaded jubilee users from ${path}`)
  return {
    // Users that have been added to the "jubilee" group
    async listJubileeUsers () {
      return jubilee
    }
  }
}

export { OfflineUserPool }
