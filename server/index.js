// env setup
const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log'
const PORT = process.env.PORT || 7777
const MAX_CACHE_POINTS = process.env.MAX_CACHE_POINTS || 900

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const lowdb = low(adapter)

// main server
const express = require('express')

const app = express()
const http = require('http')

const server = http.createServer(app)
const io = require('socket.io')(server)

// for log reader
const { exec } = require('child_process')

const Tail = require('nodejs-tail')

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

      if (cacheData.length >= MAX_CACHE_POINTS) {
        cacheData.shift()
      }

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

  socket.on('getChartData', () => {
    // prevent cache
    lowdb.read()
    const logs = lowdb.get('logs').value()
    console.log('logs read', logs.length)
    if (logs.length > 0) {
      socket.emit('setChartData', logs)
    }
  })

  socket.on('getLiveChartData', () => {
    socket.emit('setLiveChartData', cacheData)
  })
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

  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      const data = [
        new Date().getTime(), // timestamp
        224.7 + (Number.parseFloat(Math.random() * 10) + 1),
        60,
        224.7 + (Number.parseFloat(Math.random() * 10) + 1),
        60,
        1078 + (Number.parseFloat(Math.random() * 100) + 1),
        958 + (Number.parseFloat(Math.random() * 100) + 1),
        21,
        374 + (Number.parseFloat(Math.random() * 10) + 1),
        49.2 + (Number.parseFloat(Math.random() * 10) + 1),
        0,
        40 + (Number.parseFloat(Math.random() * 10) + 1),
        38,
        0,
        0,
        0,
        0,
        '00010101',
        0,
        0,
        1000 + (Number.parseFloat(Math.random() * 10) + 1),
        1000 + (Number.parseFloat(Math.random() * 10) + 1),
      ]

      if (cacheData.length >= MAX_CACHE_POINTS) {
        cacheData.shift()
      }

      cacheData.push(data)
      io.emit('updateLiveChart', data)
    }, 1000)
  }
})
// const reduceLogAndSaveToDB = require('./reduceLogAndSaveToDB')

// setInterval(() => {
//   reduceLogAndSaveToDB()
// }, 1000 * 5 * 60)
