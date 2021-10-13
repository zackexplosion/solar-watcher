import { join, dirname } from 'path'
import { Low, JSONFile } from 'lowdb'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Read data from JSON file, this will set db.data content

// import dayjs from 'dayjs'
import loadLogFromServer from '../loghandler/loadLogFromServer'
// import reduceLogAndSaveToDB from './reduceLogAndSaveToDB'
// import MODES from '../loghandler/modes'

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  fs.unlinkSync('db.json')
  fs.copyFileSync('db-origin.json', 'db.json')

  // Use JSON file for storage
  // const file = join(__dirname, 'db.json')
  const adapter = new JSONFile('db.json')
  const db = new Low(adapter)
  await db.read()

  console.log(db.data)

  // const last_log = lowdb.get('logs').last().value()
  // const start_log_time = dayjs(last_log[0])

  // console.log('start from', start_log_time.format())
  // // const ll = lowdb.data.logs
  // // console.log('ll', ll.length)
  // // return
  // // lowdb.get('logs').filter((_) => {
  // //   console.log(_[17])
  // // })
  // // await loadLogFromServer(MODES.APPEND)
  // // reduceLogAndSaveToDB(start_log_time)

  // lowdb.read()
  // const log = lowdb.get('logs').last().value()

  // console.log('end', dayjs(log[0]).format())

  // lowdb.get('logs').slice(1, 3).value().forEach((_) => {
  //   console.log(_[0], dayjs(_[0]).format())
  // })
}

main()
