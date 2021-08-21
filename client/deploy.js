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

s3_sync.syncCleanInvalidate('./build', ClientBucket, s3SyncOptions, function (
  err
) {
  if (err) {
    console.error('Deployment failed:')
    console.error(err)
    return
  }
  return console.log('Deployment complete')
})
