// env setup
const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log'
const VALID_ID_LIST = process.env.SERVER_VALID_ID_LIST.split(',').map((_) => _.trim()) || []

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

const paramMap = {
  a: 'acOutputPower',
  b: 'acOutputLoad',
  c: 'pvInputCurrent',
  d: 'pvInputVoltage',
  e: 'pvInputPower',
  f: 'pvBattVoltage',
  g: 'battVoltage',
  g2: 'battChargingCurrent',
  h: 'battCapacity',
  i: 'heatsinkTemp',
}

function parseLog(row) {
  const d = row.time_local.split(':')
  const timestamp = dayjs(`${d[0]} ${d[1]}:${d[2]}:${d[3]}`, 'DD/MMM/YY HH:mm:ss ZZ')

  // console.log(timestamp)

  const r = row.request.split(' ')
  const raw_params = new URL(`http://local${r[1]}`).searchParams

  if (!VALID_ID_LIST.includes(raw_params.get('id'))) {
    // console.error('invalid id')
    return false
  }

  const params = {
    timestamp: timestamp.valueOf(),
  }
  // // Iterate the search parameters.
  Object.keys(paramMap).forEach((k) => {
    // const v = parseFloat(raw_params.get(k)) || 0
    const v = raw_params.get(k)
    if (v) {
      if (['acOutputPower', 'pvInputPower'].includes(paramMap[k])) {
        params[paramMap[k]] = (parseFloat(v) / 10).toFixed(2)
      } else {
        params[paramMap[k]] = parseFloat(v).toFixed(2)
      }
    }
  })
  return params
}
const cacheData = []
function setupLogReader() {
  // to use Tail again cuz nginx parse cant not just read the last line
  const tail = new Tail(LOG_PATH)

  tail.on('line', (line) => {
    parser.parseLine(line, (log) => {
      const dataToUpdate = parseLog(log)
      if (dataToUpdate) {
        cacheData.shift()
        cacheData.push(dataToUpdate)
        io.emit('updateLiveChart', dataToUpdate)
      }
    })
  })

  tail.on('close', () => {
    console.log('watching stopped');
  })

  tail.watch()

  // parser.read(LOG_PATH, { tail: true }, (row) => {
  //   const dataToUpdate = parseLog(row)
  //   console.log('aaa', dataToUpdate.timestamp)
  //   io.emit('updateChart', dataToUpdate)
  // }, (err) => {
  //   if (err) throw err;
  //   console.log('Done!')
  // })
}

// main
io.on('connection', (socket) => {
  console.log('a user connected', socket.id)
  socket.emit('initLiveChart', cacheData)

  // socket.emit('updateChart', dateToUpdate)
})

const { exec } = require('child_process');

const PORT = process.env.PORT || 7777
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);

  // parser.read(LOG_PATH, (row) => {
  //   const r = parseLog(row)
  //   if (r) {
  //     cacheData.push(r)
  //     cacheData.reverse()
  //   }
  // }, (err) => {
  //   if (err) throw err;
  //   setupLogReader()
  // })
  console.time('read log')
  exec(`cat ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, (error, stdout, stderr) => {
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
      parser.parseLine(line, (log) => {
        const r = parseLog(log)
        if (r) {
          cacheData.push(r)
        }
      })
    }
    cacheData.reverse()
    // console.log(cacheData)
    console.timeEnd('read log')
    setupLogReader()

    if (process.env.NODE_ENV !== 'production') {
      setInterval(() => {
        const data = {
          timestamp: cacheData[cacheData.length - 1].timestamp + 5000,
          acOutputPower: (parseInt(Math.random() * 100) + 1),
          pvInputVoltage: (parseInt(Math.random() * 200) + 1),
          pvInputPower: (parseInt(Math.random() * 100) + 1),
          battVoltage: (parseInt(Math.random() * 40) + 1),
          battCapacity: (parseInt(Math.random() * 10) + 1),
          battChargingCurrent: (parseInt(Math.random() * 10) + 1),
          heatsinkTemp: (parseInt(Math.random() * 40) + 1),
        }
        cacheData.shift()
        cacheData.push(data)
        io.emit('updateLiveChart', data)
      }, 1000)
    }
  });
})
