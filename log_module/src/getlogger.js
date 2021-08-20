const util = require('util')

const levels = { 'trace': 0,
  'debug': 1,
  'info': 2,
  'warn': 3,
  'error': 4,
  'silent': 5 }

const logLevel = levels[(process.env.LOG_LEVEL || 'error').toLowerCase()]

/**
 * Get a logger for a subsystem (e.g. graphql, dynamodb, apollo or test).
 */
function getLogger (subsystem) {
  const logger = util.debuglog(subsystem)
  // assemble a logger with a logging function for every level,
  // when the LOG_LEVEL is higher than the level of the function,
  // an empty function is used
  return Object.entries(levels).reduce((acc, [label, level]) => {
    if (level >= logLevel) {
      const prefix = `${subsystem}:${label}`
      acc[label] = (msg, ...args) => logger(`${prefix}: ${msg}`, ...args)
    } else {
      acc[label] = () => {} // nom nom no log
    }
    return acc
  }, {})
}

module.exports = getLogger
