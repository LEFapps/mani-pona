
const BASIC_LOGGING = (function () {
  let log = () => {} // blackhole by default
  return {
    async requestDidStart (requestContext) {
      // note: Graphql queries/responses are not JSON objects, but strings
      log(`query:
      ${requestContext.request.query}
      parameters: ${JSON.stringify(requestContext.request.variables)}`)
      /*
      return {
        async didEncounterErrors (requestContext) {
          log(`error after query  ${requestContext.request.query}
          ${requestContext.errors}`)
        }
      }
      */
    },
    async didEncounterErrors (requestContext) {
      log(`error after query  ${requestContext.source}
      ${JSON.stringify(requestContext.errors)}`)
    },
    async willSendResponse (requestContext) {
      log('response sent', requestContext.response)
    },
    setLog (f) {
      log = f
    },
    resetLog () {
      log = () => {}
    }
  }
})()

module.exports = BASIC_LOGGING
