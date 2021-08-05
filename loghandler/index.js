/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const fs = require('fs')
const dayjs = require('dayjs')
const Big = require('big.js')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))

// Set some defaults
lowdb.defaults({ logs: [] })
  .write()
const MODES = require('./modes')

const MODE = process.env.MODE || MODES.RENEW

if (MODE === MODES.RENEW) {
  lowdb.get('logs')
    .remove((x) => x)
    .write()
}

const parseLog = require('../server/parseLog')
const loadLogFromServer = require('./loadLogFromServer')
const getLogList = require('./getLogList')

const NOT_COUNT_COLUMN_INDEXES = [0, 17, 18, 19]
const PERIOD_IN_MINUTES = 5
const DATA_LENGTH = 21

function handleArrayOfLogToCount(data) {
  // create result array and fill with zero as default values
  const result = new Array(DATA_LENGTH)
  result.fill(Big(0))
  // set default values
  NOT_COUNT_COLUMN_INDEXES.forEach((_) => {
    result[_] = data[0][_]
  })

  const processed_data_count = data.length

  data.forEach((_) => {
    _.forEach((d, i) => {
      if (!NOT_COUNT_COLUMN_INDEXES.includes(i)) {
        // result[i] += d

        try {
          result[i] = result[i].plus(d)
        } catch (error) {
          // console.error(error)
          // console.log('data', _)
          // processed_data_count -= 1
        }
      }
    })
  })

  try {
    for (let i = 0; i < DATA_LENGTH; i += 1) {
      if (NOT_COUNT_COLUMN_INDEXES.includes(i)) continue
      const n = result[i]
      if (!Number.isNaN(n)) {
        result[i] = Number.parseFloat(Big(n).div(processed_data_count).toFixed(2))
      }
    }

    lowdb.get('logs')
      .push(result)
      .write()
  } catch (error) {
    console.error(error)
    console.error(JSON.stringify(result))
    console.error(dayjs(data[0]).toDate())
    // console.error(data)
  }

  return result
}

const last_log = lowdb.get('logs').last().value()

function handleFile(file) {
  console.log('handling', file)
  const contents = fs.readFileSync(file, 'utf-8').split('\n')
  let d1
  let d2
  let arrayOfLogToCount = []
  // let counter = 0
  for (const c of contents) {
    const log = parseLog(c)
    // counter += 1
    if (!d1) {
      // get perfect!
      if (dayjs(log[0]).get('minutes') % PERIOD_IN_MINUTES !== 0) {
        continue
      }
      d1 = dayjs(log[0])
      console.log('start from', d1.toDate())
    }

    if (log) {
      d2 = dayjs(log[0])

      // skip old data
      if (MODE === MODES.APPEND) {
        const dd = dayjs(last_log[0])
        const diff = d2.diff(dd, 'second')
        // console.log('_diff', diff)

        if (diff < 0) {
          continue
        }
      }

      arrayOfLogToCount.push(log)
      const diff = d2.diff(d1, 'minutes')

      if (diff >= PERIOD_IN_MINUTES) {
        handleArrayOfLogToCount(arrayOfLogToCount)

        // reset
        arrayOfLogToCount = []
        d1 = dayjs(log[0])
      }
    }
  }
}

async function main() {
  console.time('took')
  console.log('current mode is', MODE)
  await loadLogFromServer()

  const files = await getLogList()

  if (MODE === MODES.RENEW) {
    for (const file of files) {
      handleFile(file)
    }
  } else {
    handleFile(files[files.length - 1])
  }

  console.timeEnd('took')
}

main()
  .catch(console.error)
