/* eslint-disable no-await-in-loop */
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

const VALID_ID_LIST = process.env.SERVER_VALID_ID_LIST.split(',').map((_) => _.trim()) || []
const { exec } = require('child_process')

const NginxParser = require('nginxparser')

const parser = new NginxParser('$remote_addr - - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"')
const dayjs = require('dayjs')
const glob = require('glob')
const Big = require('big.js')
const { MongoClient } = require('mongodb')
const paramsArrayMap = require('../server/paramsArrayMap')
const paramMapV1 = require('../server/paramMap')

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

async function startParsingLog(collection) {
  // console.log('collection', collection)

  return new Promise((resolve, reject) => {
    glob(`${__dirname}/*.log*`, {}, (er, files) => {
      const promises = []
      files.forEach((file) => {
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
              const time = dayjs(data[0]).toDate()
              const document = {
                time,
              }
              for (let i = 1; i < data.length; i += 1) {
                const key = paramsArrayMap[i]

                document[key] = data[i]
              }

              // console.log(document)
              documents.push(document)
            })
          }
          try {
            promises.push(collection.insertMany(documents))
          // const r = await collection.insertMany(documents)
          // console.log(r)
          } catch (_) {
          // console.error(_)
          }
        })
      })
      Promise.all(promises).then((_) => {
        resolve(_)
      })
    }) // glob
  })
}

// Connection URL
const url = 'mongodb://root:root@localhost:27017'
const client = new MongoClient(url)

// Database Name
const dbName = 'solar-watcher'

async function main() {
  // Use connect method to connect to the server
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('logs')
  const parsed_collection = db.collection('parsed')
  try {
    await parsed_collection.drop()
  } catch (_) {
    console.error(_)
  }
  // await startParsingLog(collection)
  const first = await collection.find({
    acOutputActivePower: {
      $ne: 0,
    },
  }).sort({
    time: 1,
  }).limit(1).toArray()

  console.log('first', first)

  let startTime = first[0].time
  let next

  do {
    const start = dayjs(startTime).toDate()
    const periodTime = dayjs(startTime).startOf('minute')
    const end = periodTime.add(15, 'minute').toDate()

    console.log('start time', start)
    // console.log('end time', end)

    next = await collection.find({
      time: {
        $gte: start,
        $lte: end,
      },
    }).toArray()

    // console.log('next', next.length)
    // console.log('next', next)

    const new_document = {
      timestamp: periodTime.toDate(),
      acOutputActivePower: new Big(0),
      pvInputPower: new Big(0),
    }

    let dataLength = next.length

    next.forEach((n) => {
      // console.log('n.acOutputActivePower', n)
      try {
        new_document.acOutputActivePower = new_document.acOutputActivePower.plus(n.acOutputActivePower)
        new_document.pvInputPower = new_document.pvInputPower.plus(n.pvInputPower)
      } catch (error) {
        dataLength -= 1
      }
    })

    new_document.acOutputActivePower = Big(new_document
      .acOutputActivePower
      .div(dataLength || 1)
      .toFixed(0))
      .toNumber()
    new_document.pvInputPower = Big(new_document
      .pvInputPower
      .div(dataLength || 1)
      .toFixed(0))
      .toNumber()

    const params = [
      new_document.timestamp.valueOf(),
      0,
      0,
      new_document.acOutputVoltage || 0,
      new_document.acOutputFrequency || 0,
      0,
      new_document.acOutputPower || 0,
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

    // console.log('new doc', dataLength, JSON.stringify(new_document))

    // const insertResult = await parsed_collection.insertMany([new_document])
    // console.log('Inserted documents =>', insertResult)

    startTime = end
  } while (dayjs(startTime).isBefore(dayjs()))

  return 'done.'
}

main()
  .then((_) => {
    console.log(_)
    process.exit()
  })
  .catch(console.error)
