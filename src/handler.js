exports.handler = (event, context, callback) => {
  console.log('VTL details: ', event)
  callback(null, event)
}
