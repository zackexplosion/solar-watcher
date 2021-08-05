/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const fs = require('fs')
const dayjs = require('dayjs')
const Big = require('big.js')

const MODES = {
  RENEW: 'RENEW',
  APPEND: 'APPEND',
}
const { SERVER_LOG_PATH } = process.env
const MODE = MODES.APPEND

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))

const parseLog = require('./parseLog')

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

function handleFile(file) {
  lowdb.read()
  const last_log = lowdb.get('logs').last().value()
  const start_date = dayjs(last_log[0])
  console.log('handling', file)
  console.log('start from', start_date.toDate())
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

  handleFile(SERVER_LOG_PATH)

  console.timeEnd('took')
}

// main()
//   .catch(console.error)

module.exports = main
