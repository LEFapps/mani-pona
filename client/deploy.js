var s3_sync = require('s3-sync')
var {
  ClientBucket,
  Region,
  CloudFrontDistribution
} = require('./sls-output.json')

var s3SyncOptions = {
  aws: {
    region: Region
  },
  limit: 16,
  cleanup: true,
  cloudFrontId: CloudFrontDistribution
}

console.log('Deploying client code to bucket: ' + ClientBucket + ' with CloudFrontId: ' + CloudFrontDistribution)

s3_sync.syncCleanInvalidate('./web-build', ClientBucket, s3SyncOptions).then(console.log).catch(console.error)
