import { getLogger } from 'server-log'
import { mani } from '../../client/shared/mani'

const log = getLogger('cognito')

function getAccountTypes () {
  const config = process.env.ACCOUNT_TYPES
  if (!config) {
    log.error('Missing ACCOUNT_TYPES ENV variable')
    return []
  }
  return JSON.parse(config).map(({ income, buffer, ...type }) => ({
    ...type,
    buffer: mani(buffer),
    income: mani(income)
  }))
}

function getAccountTypesMap () {
  return getAccountTypes().reduce((acc, t) => { acc[t.type] = t; return acc }, {})
}

export { getAccountTypes, getAccountTypesMap }
