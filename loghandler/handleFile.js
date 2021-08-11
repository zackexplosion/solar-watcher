const dayjs = require('dayjs')
const fs = require('fs')
const parseLog = require('../server/parseLog')
const handleArrayOfLogToCount = require('./handleArrayOfLogToCount')

const PERIOD_IN_MINUTES = 5
const MODES = require('./modes')

const MODE = process.env.MODE || MODES.RENEW

function handleFile(file, last_log) {
  console.log('handling', file, 'with mode:', MODE)
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

        if (diff <= 0) {
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

module.exports = handleFile
