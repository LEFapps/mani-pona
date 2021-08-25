const util = require('util')
const fs = require('fs')

const levels = { 'trace': 0,
  'debug': 1,
  'info': 2,
  'warn': 3,
  'error': 4,
  'silent': 5 }

const logLevel = levels[(process.env.LOG_LEVEL || 'error').toLowerCase()]
const logPrefix = process.env.LOG_PREFIX ? process.env.LOG_PREFIX + ':' : ''
const logFile = process.env.LOG_FILE

const logStream = (() => {
  if (!logFile) {
    return (subsystem) => {
      return util.debuglog(logPrefix + subsystem)
    }
  } else {
    const stream = fs.createWriteStream(logFile, { flags: 'a' })
    stream.write('Logging to file\n')
    return (subsystem) => {
      if (util.debuglog(logPrefix + subsystem).enabled) {
        stream.write(`Logging subsystem ${subsystem}\n`)
        return (msg, ...args) => {
          stream.write(util.format(msg, ...args))
          stream.write('\n')
        }
      } else {
        stream.write(`Logging disabled for subsystem ${subsystem}\n`)
        return () => {}
      }
    }
  }
})()

/**
 * Get a logger for a subsystem (e.g. graphql, dynamodb, apollo or test).
 */
function getLogger (subsystem) {
  //  const logger = logStream(subsystem)
  const logger = util.debuglog(logPrefix + subsystem)
  // assemble a logger with a logging function for every level,
  // when the LOG_LEVEL is higher than the level of the function,
  // an empty function is used
  return Object.entries(levels).reduce((acc, [label, level]) => {
    if (level >= logLevel) {
      acc[label] = (msg, ...args) => logger(`${label}: ${msg}`, ...args)
    } else {
      acc[label] = () => {} // nom nom no log
    }
    return acc
  }, {})
}

module.exports = getLogger
