import fs from 'fs'
import { getLogger } from 'server-log'

const log = getLogger('lambda:offlineuserpool')

/**
 * For offline development only!
 *
 * Expected format of user records:
 *
 * { ledger: '<fingerprint>'}
 */
const OfflineUserPool = (path = '.jubilee.users.json') => {
  const contents = fs.readFileSync(path, { encoding: 'utf-8' })
  if (!contents) log.error(`Please make sure ${path} is present`)
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
