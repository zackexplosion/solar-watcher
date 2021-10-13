/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import fs from 'fs'
import dayjs from 'dayjs'
import lowdb from './db.js'
import parseLog from './parseLog.js'
import handleArrayOfLogToCount from './loghandler/handleArrayOfLogToCount.js'
import lodash from 'lodash'



const { SERVER_LOG_PATH } = process.env
const PERIOD_IN_MINUTES = 5

async function main() {
  console.time('took')

  await lowdb.read()

  // ...
  // Note: db.data needs to be initialized before lodash.chain is called.
  lowdb.chain = lodash.chain(lowdb.data)

  const last_log = lowdb.get('logs').last().value()
  // const last_log = lowdb.data.logs.last()
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
    console.log('diff', diff)
    if (diff >= PERIOD_IN_MINUTES * 60) {
      // console.log('handling..', d1.format(), d2.format(), diff)
      handleArrayOfLogToCount(arrayOfLogToCount)

      // reset
      arrayOfLogToCount = []
      d1 = d1.add(5, 'minutes')
    }
  }

  console.timeEnd('took')
}

export default main

// rsync -avz --progress  zack@35.185.219.199:/var/log/nginx/solar.log /Users/zack/projects/solar-watcher/loghandler
