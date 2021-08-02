/* eslint-disable no-await-in-loop */
const { SERVER_LOG_URI } = process.env
const MODE = process.env.MODE || 'renew'

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const lowdb = low(adapter)

// Set some defaults
lowdb.defaults({ logs: [] })
  .write()

// reset
lowdb.get('logs')
  .remove((x) => x)
  .write()

const { exec } = require('child_process')

const NginxParser = require('nginxparser')

const parser = new NginxParser('$remote_addr - - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"')
const dayjs = require('dayjs')
const glob = require('glob')
const Big = require('big.js')
const { MongoClient } = require('mongodb')
const util = require('util');
const path = require('path')
const paramsArrayMap = require('../server/paramsArrayMap')
const parseLog = require('../server/parseLog')

const promiseExec = util.promisify(exec);

async function loadLogFromServer() {
  try {
    await promiseExec(`rm -rf ${path.join(__dirname, 'solar*')}`)
  } catch (error) {
    console.error(error)
  }
  return new Promise(((resolve, reject) => {
    exec(`scp '${SERVER_LOG_URI}' ${__dirname}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }

      exec(`gunzip -d ${__dirname}/solar*.gz`, (_error, _stdout, _stderr) => {
        if (_error) {
          return reject(_error)
        }
        return resolve(true)
      })
    })
  }))
}
async function startParsingLog(collection) {
  // console.log('collection', collection)

  const last = await collection.find({
    acOutputActivePower: {
      $ne: 0,
    },
  }).sort({
    time: -1,
  }).limit(1).toArray()

  console.log('last record time is', last.time)

  return new Promise((resolve, reject) => {
    glob(`${__dirname}/*.log*`, {}, (er, files) => {
      const promises = []
      files.forEach((file) => {
        const p = new Promise((_resolve, _reject) => {
          exec(`cat ${file}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
            if (error) {
              console.log(`error: ${error.message}`)
              return
            }

            if (stderr) {
              console.log(`stderr: ${stderr}`)
              return
            }

            const cacheLogs = stdout.split('\n')
            const documents = []
            for (let index = cacheLogs.length - 1; index >= 0; index -= 1) {
              const line = cacheLogs[index]
              parser.parseLine(line, async (log) => {
                const data = parseLog(log)
                const time = dayjs(data[0])
                const document = {
                  time: time.toDate(),
                }
                for (let i = 1; i < data.length; i += 1) {
                  const key = paramsArrayMap[i]

                  document[key] = data[i]
                }

                // console.log('typeof last', typeof last.time === 'undefined')
                // console.log('time.isAfter(dayjs(last.time)', time.isAfter(dayjs(last.time)))
                // prevent handle old log again
                const writeToDB = (typeof last.time === 'undefined') || time.isAfter(dayjs(last.time))
                process.stdout.write(`handliing ${time.toDate()}, writeToDB ${writeToDB}\r`)

                if (writeToDB) {
                  documents.push(document)
                }
              })
            }
            try {
              if (documents.length > 0) {
                const r = await collection.insertMany(documents)
                console.log(r)
              }

              _resolve()
            } catch (_) {
              // console.error(_)
            }
          })
        })
        promises.push(p)
      })
      console.log('promises', promises)
      Promise.all(promises).then((_) => {
        process.stdout.write('\n')
        resolve(_)
      })
    }) // glob
  })
}

// Connection URL
const url = 'mongodb://root:root@localhost:27017'
// Database Name
const dbName = 'solar-watcher'
const client = new MongoClient(url)

function getFieldsToProcess(cb) {
  paramsArrayMap.forEach((_, index) => {
    if (![0, 17].includes(index)) {
      cb(_)
    }
  })
}

async function main() {
  console.time('took')
  // Use connect method to connect to the server
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('logs')

  // try {
  //   await collection.drop()
  // } catch (_) {
  //   console.error(_)
  // }

  console.log('copy log from server')
  await loadLogFromServer()

  console.log('parsing log to db')
  await startParsingLog(collection)

  // await startParsingLog(collection)
  let first

  if (MODE === 'renew') {
    first = await collection.find({
      // acOutputActivePower: {
      //   $ne: 0,
      // },
    }).sort({
      time: 1,
    }).limit(1).toArray()
  } else {
    // start from last one
    first = await collection.find({
    }).sort({
      time: -1,
    }).limit(1).toArray()
  }

  if (!first) {
    return
  }

  console.log('first', first)

  let startTime = first[0].time
  let next

  do {
    const start = dayjs(startTime).toDate()
    const periodTime = dayjs(startTime).startOf('minute')
    const end = periodTime.add(5, 'minute').toDate()

    next = await collection.find({
      time: {
        $gte: start,
        $lte: end,
      },
    }).toArray()
    const new_document = {
      timestamp: periodTime.toDate(),
      // acOutputActivePower: new Big(0),
      // pvInputPower: new Big(0),
    }

    getFieldsToProcess((_) => {
      new_document[_] = new Big(0)
    })
    // paramsArrayMap.forEach((_, index) => {
    //   if (![0, 17].includes(index)) {
    //     new_document[_] = new Big(0)
    //   }
    // })

    let dataLength = next.length

    next.forEach((n) => {
      // console.log('n.acOutputActivePower', n)
      try {
        getFieldsToProcess((_) => {
          new_document[_] = new_document[_].plus(n[_])
        })
      } catch (error) {
        dataLength -= 1
      }
    })

    getFieldsToProcess((_) => {
      new_document[_] = new Big(new_document[_]
        .div(dataLength || 1)
        .toFixed(0))
        .toNumber()
    })

    const params = [
      new_document.timestamp.valueOf(),
      0,
      0,
      new_document.acOutputVoltage || 0,
      new_document.acOutputFrequency || 0,
      0,
      new_document.acOutputActivePower || 0,
      new_document.acOutputLoad || 0,
      0,
      new_document.batteryVoltage || 0,
      new_document.batteryChargingCurrent || 0,
      new_document.batteryCapacity || 0,
      new_document.heatSinkTemp || 0,
      new_document.pvInputCurrent || 0,
      new_document.pvInputVoltage || 0,
      0,
      0,
      0,
      0,
      0,
      new_document.pvInputPower || 0,
    ]

    lowdb.get('logs')
      .push(params)
      .write()

    // console.log('Inserted documents =>', JSON.stringify(params))

    process.stdout.write(`Inserted ${startTime} ${JSON.stringify(params)}\r`)

    startTime = end
  } while (dayjs(startTime).isBefore(dayjs()))

  process.stdout.write('\n')
  console.timeEnd('took')
  return 'done.'
}

main()
  .then((_) => {
    console.log(_)
    process.exit()
  })
  .catch(console.error)
