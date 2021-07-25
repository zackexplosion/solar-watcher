const LOG_PATH = process.env.SERVER_LOG_PATH || './solar.log.1'
const VALID_ID_LIST = process.env.SERVER_VALID_ID_LIST.split(',').map((_) => _.trim()) || []
const { exec } = require('child_process')

const NginxParser = require('nginxparser')

const parser = new NginxParser('$remote_addr - - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"')
const dayjs = require('dayjs')
const paramMapV1 = require('./paramMap')

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
  const d = row.time_local.split(':')
  const timestamp = dayjs(`${d[0]} ${d[1]}:${d[2]}:${d[3]}`, 'DD/MMM/YY HH:mm:ss ZZ')
  const r = row.request.split(' ')
  const raw_params = new URL(`http://local${r[1]}`).searchParams

  if (!VALID_ID_LIST.includes(raw_params.get('id'))) {
    return false
  }

  let params = []
  const dataParam = raw_params.get('data')
  if (dataParam) {
    // if (dataParam[0] !== '2') {
    //   dataParam = dataParam.slice(1)
    // }

    // console.log(dataParam)

    params = [
      timestamp.valueOf(),
      ...dataParam.split(',').map((_, index) => {
        if (index !== 16) { // skip the flags column
          const m = _.match(/[\d]+\.[\d]+/)
          if (m) {
            return parseFloat(m[0]) || 0
          }
          return parseFloat(_) || 0
        }

        return _
      }),
    ]
    // console.log(params)
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

  return params
}

function handleTmpData(tmpData) {
  console.log(tmpData)
}

exec(`cat ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }

  if (stderr) {
    console.log(`stderr: ${stderr}`)
    return
  }

  const cacheLogs = stdout.split('\n')

  for (let index = cacheLogs.length - 1; index >= 0; index -= 1) {
    const line = cacheLogs[index]
    let m = null
    let tmpData = []
    parser.parseLine(line, (log) => {
      const data = parseLog(log)
      const d = dayjs(data[0])

      console.log('tmpData', m)
      if (tmpData.length !== 0) {
        handleTmpData(tmpData)
      }

      if (m === null || m !== d.minute()) {
        m = d.minute()
        tmpData = []
      }

      tmpData.push(data)
    })
  }
})
