const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const dayjs = require('dayjs')
const fs = require('fs')
const loadLogFromServer = require('../loghandler/loadLogFromServer')
const reduceLogAndSaveToDB = require('./reduceLogAndSaveToDB')
const MODES = require('../loghandler/modes')

const lowdb = low(new FileSync('db.json'))

async function main() {
  fs.unlinkSync('db.json')
  fs.copyFileSync('db-origin.json', 'db.json')
  lowdb.read()

  const last_log = lowdb.get('logs').last().value()
  const start_log_time = dayjs(last_log[0])

  console.log('start from', start_log_time.format())
  // const ll = lowdb.data.logs
  // console.log('ll', ll.length)
  // return
  // lowdb.get('logs').filter((_) => {
  //   console.log(_[17])
  // })
  // await loadLogFromServer(MODES.APPEND)
  // reduceLogAndSaveToDB(start_log_time)

  lowdb.read()
  const log = lowdb.get('logs').last().value()

  console.log('end', dayjs(log[0]).format())

  // lowdb.get('logs').slice(1, 3).value().forEach((_) => {
  //   console.log(_[0], dayjs(_[0]).format())
  // })
}

main()
