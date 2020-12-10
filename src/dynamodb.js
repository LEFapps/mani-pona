const { DynamoPlus } = require('dynamo-plus')

var options = {
  region: 'localhost',
  endpoint: 'http://localhost:8000'
}

var isOffline = function () {
  // Depends on serverless-offline plugion which adds IS_OFFLINE to process.env when running offline
  return process.env.IS_OFFLINE
}

module.exports = isOffline() ? DynamoPlus(options) : DynamoPlus()
