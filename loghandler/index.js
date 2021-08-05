/* eslint-disable no-underscore-dangle */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { SERVER_LOG_URI, SERVER_LOG_URI_RENEW } = process.env
const fs = require('fs')
const dayjs = require('dayjs')
const Big = require('big.js')

const MODES = {
  RENEW: 'RENEW',
  APPEND: 'APPEND',
}

const MODE = process.env.MODE || MODES.RENEW

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))

// Set some defaults
lowdb.defaults({ logs: [] })
  .write()

if (MODE === MODES.RENEW) {
// reset
  lowdb.get('logs')
    .remove((x) => x)
    .write()
}

const { exec } = require('child_process')

const glob = require('glob')
const util = require('util');
const path = require('path')
const parseLog = require('../server/parseLog')

const promiseExec = util.promisify(exec);

async function loadLogFromServer() {
  console.log('copy log from server')
  let log_path = SERVER_LOG_URI
  if (MODE === MODES.RENEW) {
    log_path = SERVER_LOG_URI_RENEW
    try {
      await promiseExec(`rm -rf ${path.join(__dirname, 'solar*')}`)
    } catch (error) {
      console.error(error)
    }
  }

  return new Promise(((resolve, reject) => {
    exec(`scp '${log_path}' ${__dirname}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }

      if (MODE === MODES.RENEW) {
        exec(`gunzip -d ${__dirname}/solar*.gz`, (_error, _stdout, _stderr) => {
          if (_error) {
            return reject(_error)
          }
          return resolve(true)
        })
      } else {
        resolve(true)
      }
    })
  }))
}

function getLogList() {
  return new Promise((resolve, reject) => {
    glob(`${__dirname}/*.log*`, {}, (err, files) => {
      if (err) return reject(err)

      const regex = /solar.log\.?(\d+)/

      // sort log files name, start from oldest
      files.sort((a, b) => {
        let _a = a.match(regex)
        if (_a && _a[1]) {
          _a = parseInt(_a[1])
        }

        let _b = b.match(regex)
        if (_b && _b[1]) {
          _b = parseInt(_b[1])
        }

        if (_a > _b) return -1
        if (_a < _b) return 1
      })

      return resolve(files)
    })
  })
}

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
