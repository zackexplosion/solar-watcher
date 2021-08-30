const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const dayjs = require('dayjs')
const loadLogFromServer = require('../loghandler/loadLogFromServer')
const reduceLogAndSaveToDB = require('./reduceLogAndSaveToDB')
const MODES = require('../loghandler/modes')

const lowdb = low(new FileSync('db.json'))

async function main() {
  lowdb.read()
  const last_log = lowdb.get('logs').last().value()
  const start_log_time = dayjs(last_log[0])

  console.log('start from', start_log_time.format())
  // await loadLogFromServer(MODES.APPEND)
  reduceLogAndSaveToDB()

  lowdb.read()
  const log = lowdb.get('logs').last().value()

  console.log('e', dayjs(log[0]).format())

  // lowdb.get('logs').slice(1, 3).value().forEach((_) => {
  //   console.log(_[0], dayjs(_[0]).format())
  // })
}

main()
