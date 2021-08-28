/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const low = require('lowdb')
const fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')
const dayjs = require('dayjs')
const parseLog = require('./parseLog')
const handleArrayOfLogToCount = require('../loghandler/handleArrayOfLogToCount')

const { SERVER_LOG_PATH } = process.env
const PERIOD_IN_MINUTES = 5
const lowdb = low(new FileSync('db.json'))
async function main() {
  console.time('took')

  lowdb.read()

  const last_log = lowdb.get('logs').last().value()
  let start_log_time = dayjs(last_log[0])
  let next_log_time = dayjs(last_log[0]).add(5, 'minutes')

  const contents = fs.readFileSync(SERVER_LOG_PATH, 'utf-8').split('\n')
  // handleFile(SERVER_LOG_PATH, last_log)
  let arrayOfLogToCount = []
  for (const c of contents) {
    const log = parseLog(c)
    const skip_old_data_diff = next_log_time.diff(start_log_time, 'seconds')

    if (skip_old_data_diff <= 0) {
      continue
    }

    if (!log) {
      continue
    }

    arrayOfLogToCount.push(log)
    const diff = next_log_time.diff(start_log_time, 'minutes')
    if (diff >= PERIOD_IN_MINUTES) {
      handleArrayOfLogToCount(arrayOfLogToCount)

      // reset
      arrayOfLogToCount = []
      start_log_time = dayjs(log[0])
      next_log_time = start_log_time.add(5, 'minutes')
    }
  }

  console.timeEnd('took')
}

if (require.main === module) {
  console.log('called directly');
  main()
} else {
  module.exports = main
}
