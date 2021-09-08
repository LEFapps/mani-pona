var s3_sync = require('s3-sync')
var {
  IdentityPoolId,
  UserPoolClientId,
  UserPoolId,
  AuthorizerId,
  ServiceEndpoint,
  ClientBucket,
  Region,
  GraphqlLambdaFunctionQualifiedArn
} = require('./sls-output.json')

var s3SyncOptions = {
  aws: {
    region: Region
  },
  limit: 16,
  cleanup: true
}

console.log('Deploying client code to bucket: ' + ClientBucket)

s3_sync.syncCleanInvalidate('./web-build', ClientBucket, s3SyncOptions).then(console.log).catch(console.error)
