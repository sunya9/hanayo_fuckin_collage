const Twitter = require('twitter')
const settings = require('./config.json')

const { getScreenName, initStream } = require('./lib/func')

getScreenName()
  .then(initStream)
  .catch(console.error)
