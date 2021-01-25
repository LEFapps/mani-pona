#!/usr/bin/env node

var AWS = require('aws-sdk')
const fs = require('fs')
// Set the region
AWS.config.update({ region: 'localhost', endpoint: 'http://localhost:8000' })

var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

var params = {
  TableName: 'manipona'
}
const filename = process.argv[2]

if (!filename) {
  console.error('Please provide filename as argument')
  process.exit(0)
}

console.log('Calling the Scan API on the manipona table')
docClient.scan(params, function (err, data) {
  if (err) {
    console.error(err) // an error occurred
  } else {
    console.log('The Scan call evaluated ' + data.ScannedCount + ' items')
    fs.writeFile(filename, JSON.stringify(data.Items, null, 2), {}, (err) => {
      if (err) {
        console.error(err)
      }
    })
  }
})
