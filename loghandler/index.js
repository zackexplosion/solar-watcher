/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { SERVER_LOG_URI, SERVER_LOG_URI_RENEW } = process.env
const fs = require('fs')
const dayjs = require('dayjs')
const Big = require('big.js')

const MODE = process.env.MODE || 'renew'

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))

// Set some defaults
lowdb.defaults({ logs: [] })
  .write()

if (MODE === 'renew') {
// reset
  lowdb.get('logs')
    .remove((x) => x)
    .write()
}

const { exec } = require('child_process')

const glob = require('glob')
const util = require('util');
const path = require('path')
const paramsArrayMap = require('../server/paramsArrayMap')
const parseLog = require('../server/parseLog')

const promiseExec = util.promisify(exec);

async function loadLogFromServer() {
  console.log('copy log from server')
  let log_path = SERVER_LOG_URI
  if (MODE === 'renew') {
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

      if (MODE === 'renew') {
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
function handleArrayOfLogToCount(data) {
  const result = new Array(22)
  result.fill(0)

  const [startTime] = data[0]
  result[0] = startTime

  data.forEach((_) => {
    _.forEach((d, i) => {
      if (NOT_COUNT_COLUMN_INDEXES.includes(i)) {
        // result[i] += d
      } else {
        result[i] += d
      }
    })
  })

  for (let i = 0; i < 22; i += 1) {
    if (NOT_COUNT_COLUMN_INDEXES.includes(i)) continue
    result[i] = Number.parseFloat(Big(result[i]).div(data.length).toFixed(2))
  }

  lowdb.get('logs')
    .push(result)
    .write()

  return result
}

const PERIOD_IN_MINUTES = 5

async function main() {
  console.time('took')
  console.log('current mode is', MODE)
  // await loadLogFromServer()

  const files = await getLogList()
  for (const file of files) {
    console.log('handling', file)
    const contents = fs.readFileSync(file, 'utf-8').split('\n')
    let d1
    let d2
    let arrayOfLogToCount = []
    // let counter = 0
    for (const c of contents) {
      // counter += 1
      const log = parseLog(c)
      if (!d1) {
        // get perfect!
        if (dayjs(log[0]).get('minutes') % PERIOD_IN_MINUTES !== 0) {
          continue
        }
        d1 = dayjs(log[0])
        console.log('start from', d1.toDate())
      }

      d2 = dayjs(log[0])

      if (log) {
        arrayOfLogToCount.push(log)
        const output = `handling ${d2.toDate()}\r`

        // console.log(output)
        // process.stdout.write(output)
      }

      const diff = d2.diff(d1, 'minutes')
      // console.log('Diff:', diff, d1.toDate(), d2.toDate())

      // process.stdout.write(`Diff: ${d1.diff(d2, 'minutes')}`)

      if (diff >= PERIOD_IN_MINUTES) {
        // console.log('yee')
        // console.log("d2.diff(d1, 'minute')", d2.diff(d1, 'minute'), d1.toDate(), d2.toDate())
        // console.log(arrayOfLogToCount)
        handleArrayOfLogToCount(arrayOfLogToCount)

        // reset
        arrayOfLogToCount = []
        d1 = dayjs(log[0])
      }

      // if (counter >= 300) break
    }
  }
  console.timeEnd('took')
}

main()
  .catch(console.error)
