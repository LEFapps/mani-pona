const getLogger = require('./getlogger')

const log = getLogger('graphql:apollo')

const apolloLoggerPlugin = (function () {
  return {
    async requestDidStart (requestContext) {
      // note: Graphql queries/responses are not JSON objects, but strings
      log.debug('query: %s, params: %j', requestContext.request.query, requestContext.request.variables)
      return {
        async parsingDidStart () {
          return async (err) => {
            if (err) {
              log.error('Error during parsing:\n%j', err)
            }
          }
        },
        async validationDidStart () {
        // This end hook is unique in that it can receive an array of errors,
        // which will contain every validation error that occurred.
          return async (errs) => {
            if (errs) {
              errs.forEach(err => log.error('Error during validation:\n%j', err))
            }
          }
        },
        async executionDidStart () {
          return {
            async executionDidEnd (err) {
              if (err) {
                log.error('Error during execution:\n%j', err)
              }
            }
          }
        },
        async didEncounterErrors ({ source, errors }) {
          log.error('error after query, source: %s - error %j', source, errors)
        },
        async willSendResponse (requestContext) {
          log.debug('response sent %s', requestContext.response)
        }
      }
    }
  }
})()

module.exports = apolloLoggerPlugin
