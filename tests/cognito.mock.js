
/**
 * Ultimately the users credential will generate a cognito user in the events requestContext, as such:
 * const cognitoUser = event.requestContext.authorizer.claims
 * usefull field: cognitoUser.sub
 * */
const cognito = (function () {
  let ledger = 'foo'
  let verified = false
  return {
    setLedger: (id) => {
      ledger = id
    },
    setVerified: (b) => {
      verified = b
    },
    context: (event) => {
      return {
        ledger,
        verified
      }
    }
  }
}())

module.exports = cognito
