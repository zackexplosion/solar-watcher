/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const low = require('lowdb')
const fs = require('fs')
const FileSync = require('lowdb/adapters/FileSync')
const dayjs = require('dayjs')
const parseLog = require('./parseLog')
const handleArrayOfLogToCount = require('./loghandler/handleArrayOfLogToCount')

const { SERVER_LOG_PATH } = process.env
const PERIOD_IN_MINUTES = 5
const lowdb = low(new FileSync('./db.json'))
async function main() {
  console.time('handleArrayOfLogToCount')

  lowdb.read()

  const last_log = lowdb.get('logs').last().value()
  let d1 = dayjs(last_log[0]).startOf('m')
  let d2

  const now = dayjs()

  if (now.diff(d1, 'minutes') < 5) {
    console.log('run too earlier')
    return
  }

  // console.log('log appender running', start_log_time.format(), 'to', next_log_time.format())
  const contents = fs.readFileSync(SERVER_LOG_PATH, 'utf-8').split('\n')

  let arrayOfLogToCount = []
  for (const c of contents) {
    const log = parseLog(c)

    if (!log) {
      continue
    }

    d2 = dayjs(log[0])
    const skip_old_data_diff = d2.diff(d1, 's')

    if (skip_old_data_diff < 300) {
      // console.log('skip', skip_old_data_diff)
      continue
    }

    // const d = dayjs(log[0])
    // log[17] = 'append'
    arrayOfLogToCount.push(log)
    const diff = d2.diff(d1, 's')
    // console.log('diff', diff)
    if (diff >= PERIOD_IN_MINUTES * 60) {
      // console.log('handling..', d1.format(), d2.format(), diff)
      handleArrayOfLogToCount(arrayOfLogToCount)

      // reset
      arrayOfLogToCount = []
      d1 = d1.add(5, 'minutes')
    }
  }

  console.timeEnd('handleArrayOfLogToCount')
}

if (require.main === module) {
  console.log('called directly');
  main()
} else {
  module.exports = main
}

// rsync -avz --progress  zack@35.185.219.199:/var/log/nginx/solar.log /Users/zack/projects/solar-watcher/loghandler
