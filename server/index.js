// env setup
const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log'
const PORT = process.env.PORT || 7777
const MAX_CACHE_POINTS = process.env.MAX_CACHE_POINTS || 900
const LIVE_CHART_LOADED_DAYS = 3

// main server
const express = require('express')

const app = express()
const http = require('http')
const dayjs = require('dayjs')

const server = http.createServer(app)
const io = require('socket.io')(server)

// for log reader
const { exec } = require('child_process')

const Tail = require('nodejs-tail')
const db = require('./db')

const parseLog = require('./parseLog')

const cacheData = []

// const cacheData = []
function setupLogReader() {
  // to use Tail again cuz nginx parse cant not just read the last line
  const tail = new Tail(LOG_PATH)

  tail.on('line', async (line) => {
    try {
      const data = parseLog(line)
      if (!data) return
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

  socket.on('getChartData', () => {
    // prevent cache
    db.read()
    // const logs = db.get('logs').value()
    const now = dayjs().startOf('d')
    const logs = db.get('logs').filter((_) => now.diff(dayjs(_[0]), 'h') < LIVE_CHART_LOADED_DAYS * 24).value()
    console.log('logs read', logs.length)
    if (logs.length > 0) {
      socket.emit('setChartData', logs)
    }
  })

  // socket.on('getLiveChartData', () => {
  //   socket.emit('setLiveChartData', cacheData)
  // })
})

// only cache last 15min
exec(`tail -n ${MAX_CACHE_POINTS} ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`)
    return
  }

  const cacheLogs = stdout.split('\n')
  // console.log(cacheLogs)
  // const promises = []
  for (let index = cacheLogs.length - 1; index >= 0; index -= 1) {
    const line = cacheLogs[index]
    const data = parseLog(line)
    if (data) {
      cacheData.push(data)
    }
  }

  cacheData.reverse()

  setupLogReader()

  // console.log('cacheData', cacheData)
  server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  })

  function getRandom(n1, seed) {
    const _seed = seed || 1
    let r = Number.parseFloat((Math.random() * _seed) + 1)
    r += n1
    return Number.parseFloat(r.toFixed(2))
  }

  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      const data = [
        new Date().getTime(), // timestamp
        getRandom(224.7, 1), // gridVoltage
        60, // gridFrequency
        getRandom(224.7, 1),
        60,
        getRandom(1078, 100),
        getRandom(958, 100),
        21,
        getRandom(374, 1),
        getRandom(49.2, 1),
        getRandom(1, 10),
        getRandom(40, 10),
        getRandom(38, 10),
        getRandom(0, 10),
        getRandom(0, 10),
        getRandom(0, 10),
        getRandom(0, 10), // batteryDischargeCurrent
        '00010101',
        0,
        0,
        getRandom(1000, 10),
      ]

      if (cacheData.length >= MAX_CACHE_POINTS) {
        cacheData.shift()
      }

      cacheData.push(data)
      io.emit('updateLiveChart', data)
    }, 1000)
  }
})
const reduceLogAndSaveToDB = require('./reduceLogAndSaveToDB')

let latest_date = 0
setInterval(() => {
  reduceLogAndSaveToDB()

  try {
  // prevent cache
    db.read()
    const log = db.get('logs').last().value()
    if (log && latest_date !== log[0]) {
      io.emit('appendDataToChart', log)
      latest_date = log[0]
    }
  } catch (error) {
    console.error(error)
  }
}, 1000 * 60 * 5.1)
