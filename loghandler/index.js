const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const lowdb = low(new FileSync('db.json'))

// Set some defaults
lowdb.defaults({ logs: [] })
  .write()
const MODES = require('./modes')

const MODE = process.env.MODE || MODES.RENEW

if (MODE === MODES.RENEW) {
  lowdb.get('logs')
    .remove((x) => x)
    .write()
}

const loadLogFromServer = require('./loadLogFromServer')
const getLogList = require('./getLogList')
const handleFile = require('./handleFile')

const last_log = lowdb.get('logs').last().value()

async function main() {
  console.time('took')
  console.log('current mode is', MODE)
  await loadLogFromServer()

  const files = await getLogList()

  if (MODE === MODES.RENEW) {
    for (const file of files) {
      handleFile(file, last_log)
    }
  } else {
    handleFile(files[files.length - 1], last_log)
  }

  console.timeEnd('took')
}

main()
  .catch(console.error)
