const VALID_ID_LIST = process.env.SERVER_VALID_ID_LIST.split(',').map((_) => _.trim()) || []
const dayjs = require('dayjs')
const paramMapV1 = require('./paramMap')
const paramsArrayMap = require('./paramsArrayMap')

function parseLogV1(raw_params) {
  const output = {}

  // // Iterate the search parameters.
  Object.keys(paramMapV1).forEach((k) => {
    // const v = parseFloat(raw_params.get(k)) || 0
    const v = raw_params.get(k)
    if (v) {
      try {
        if (k === 'flags') {
          output[paramMapV1[k]] = v
        } else {
          output[paramMapV1[k]] = parseFloat(v)
        }
      } catch (error) {
        console.error(error)
        console.log('output', JSON.stringify(output))
      }
    }
  })
  return output
}

function parseLog(row) {
  const m = row.match(/\[(.+)\] "GET \/\?(.+) HTTP/)

  // console.log(m)
  if (!m || !m[1]) return false
  const d = m[1].split(':')
  const r = m[2]
  // const r = row.request.split(' ')
  const NOT_COUNT_COLUMN_INDEXES = [17, 18, 19]
  const timestamp = dayjs(`${d[0]} ${d[1]}:${d[2]}:${d[3]}`, 'DD/MMM/YY HH:mm:ss ZZ')
  // const timestamp = dayjs(m[1], 'DD/MMM/YY HH:mm:ss ZZ')
  const raw_params = new URL(`http://local/?${r}`).searchParams

  // console.log(timestamp.toDate())

  if (!VALID_ID_LIST.includes(raw_params.get('id'))) {
    return false
  }

  let params = Array(21)
  params.fill(0)
  let dataParam = raw_params.get('data')
  if (dataParam) {
    dataParam = dataParam.split(',')
    // console.log(dataParam.length)
    if (dataParam.length !== 21) {
      return false
    }

    params = [
      timestamp.valueOf(),
    ]

    // console.log(params, JSON.stringify(dataParam))

    // params[1] = dataParam[0]
    // params[2] = dataParam[1]

    for (let i = 1; i < paramsArrayMap.length; i += 1) {
      const v = dataParam[i - 1]
      if (!NOT_COUNT_COLUMN_INDEXES.includes(i) && v) {
        const mm = v.match(/[\d]+\.[\d]+/)
        // console.log(mm)
        if (mm) {
          params[i] = parseFloat(mm[0]) || 0
        } else {
          params[i] = v
        }
      } else {
        params[i] = v
      }

      // else {
      // // const index = index + 1
      //   const mm = dataParam[i - 1].match(/[\d]+\.[\d]+/)

      //   if (mm) {
      //     const data = parseFloat(m[0]) || 0
      //     params[i] = data
      //   }
      // }
    }
  } else {
    const _ = parseLogV1(raw_params)
    params = [
      timestamp.valueOf(),
      0,
      0,
      _.acOutputVoltage || 0,
      _.acOutputFrequency || 0,
      0,
      _.acOutputPower || 0,
      _.acOutputLoad || 0,
      0,
      _.batteryVoltage || 0,
      _.batteryChargingCurrent || 0,
      _.batteryCapacity || 0,
      _.heatSinkTemp || 0,
      _.pvInputCurrent || 0,
      _.pvInputVoltage || 0,
      0,
      0,
      0,
      0,
      0,
      _.pvInputPower || 0,
    ]
  }

  // console.log(params)

  return params
}

module.exports = parseLog
