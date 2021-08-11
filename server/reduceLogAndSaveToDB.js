/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))
const MODES = {
  RENEW: 'RENEW',
  APPEND: 'APPEND',
}
const { SERVER_LOG_PATH } = process.env
process.env.MODE = MODES.APPEND
const handleFile = require('../loghandler/handleFile')

async function main() {
  console.time('took')
  const last_log = lowdb.get('logs').last().value()
  handleFile(SERVER_LOG_PATH, last_log)

  console.timeEnd('took')
}

if (require.main === module) {
  console.log('called directly');
  main()
} else {
  module.exports = main
}
