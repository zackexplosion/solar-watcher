// env setup
const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log'
const VALID_ID_LIST = process.env.SERVER_VALID_ID_LIST.split(',').map((_) => _.trim()) || []
const PORT = process.env.PORT || 7777

// main server
const express = require('express')
const dayjs = require('dayjs')

const app = express()
const http = require('http')

const server = http.createServer(app)
const io = require('socket.io')(server)

// for log reader
const NginxParser = require('nginxparser')

const parser = new NginxParser('$remote_addr - - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"');
const Tail = require('nodejs-tail');
const { exec } = require('child_process')
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
  let dataParam = raw_params.get('data')

  if (dataParam) {
    if (dataParam[0] !== '2') {
      dataParam = dataParam.slice(1)
    }

    // console.log(dataParam)

    params = [
      timestamp.valueOf(),
      ...dataParam.split(',').map((_, index) => {
        if (index !== 16) { // skip the flags column
          return parseFloat(_)
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

  // console.log(params)

  return params
}

async function getParsedLog(line) {
  return new Promise((resolve, reject) => {
    parser.parseLine(line, (log) => {
      const r = parseLog(log)
      if (r) {
        return resolve(r)
      }
      return reject(new Error())
    })
  })
}

const cacheData = []
function setupLogReader() {
  // to use Tail again cuz nginx parse cant not just read the last line
  const tail = new Tail(LOG_PATH)

  tail.on('line', async (line) => {
    try {
      const data = await getParsedLog(line)
      cacheData.shift()
      cacheData.push(data)
      io.emit('updateLiveChart', data)
    } catch (error) {
      console.error(error)
    }
  })

  tail.on('close', () => {
    console.log('watching stopped');
  })

  tail.watch()
}

// main
io.on('connection', (socket) => {
  console.log('a user connected', socket.id, new Date())
  socket.emit('initLiveChart', cacheData)
})

console.time('read log')
exec(`cat ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }

  const cacheLogs = stdout.split('\n')
  for (let index = cacheLogs.length - 1; index > 0; index -= 1) {
    const line = cacheLogs[index]
    try {
      // eslint-disable-next-line no-await-in-loop
      const data = await getParsedLog(line)
      cacheData.push(data)
    } catch (err) {
      console.error(err)
    }
  }
  cacheData.reverse()
  console.timeEnd('read log')

  setupLogReader()

  // console.log(cacheData)

  server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  })

  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      const data = [
        new Date().getTime(), // timestamp
        224.7 + (parseInt(Math.random() * 10) + 1),
        60,
        224.7 + (parseInt(Math.random() * 10) + 1),
        60,
        1078 + (parseInt(Math.random() * 100) + 1),
        958 + (parseInt(Math.random() * 100) + 1),
        21,
        374 + (parseInt(Math.random() * 10) + 1),
        49.2 + (parseInt(Math.random() * 10) + 1),
        0,
        40 + (parseInt(Math.random() * 10) + 1),
        38,
        0,
        0,
        0,
        0,
        '00010101',
        0,
        0,
        0,
        1,
      ]
      cacheData.shift()
      cacheData.push(data)
      io.emit('updateLiveChart', data)
    }, 1000)
  }
});
