const getLogger = require('./getlogger')

const log = getLogger('apollo-server')

const apolloLoggerPlugin = (function () {
  return {
    async requestDidStart (requestContext) {
      // note: Graphql queries/responses are not JSON objects, but strings
      log.debug('query: %s, params: %j', requestContext.request.query, requestContext.request.variables)
    },
    async didEncounterErrors (requestContext) {
      log.error('error after query, source: %s - error %j', requestContext.source, requestContext.errors)
    },
    async willSendResponse (requestContext) {
      log.debug('response sent %s', requestContext.response)
    }
  }
})()

module.exports = apolloLoggerPlugin
