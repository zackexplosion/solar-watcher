/* eslint-disable no-continue */
const dayjs = require('dayjs')
const Big = require('big.js')
const db = require('../server/db')

const NOT_COUNT_COLUMN_INDEXES = [0, 17, 18, 19]
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
    // console.log(dayjs(data[0]).toDate())
    db.get('logs')
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

module.exports = handleArrayOfLogToCount
