const { SERVER_LOG_URI, SERVER_LOG_URI_RENEW } = process.env
const { exec } = require('child_process')
const util = require('util')
const path = require('path')
const MODES = require('./modes')

// const MODE = process.env.MODE || MODES.RENEW

const promiseExec = util.promisify(exec)

async function loadLogFromServer(MODE = process.env.MODE) {
  console.log('copy log from server with', MODE, 'mode')
  let log_path = SERVER_LOG_URI
  if (MODE === MODES.RENEW) {
    log_path = SERVER_LOG_URI_RENEW
    try {
      await promiseExec(`rm -rf ${path.join(__dirname, 'solar*')}`)
    } catch (error) {
      console.error(error)
    }
  }

  return new Promise(((resolve, reject) => {
    exec(`scp '${log_path}' ${__dirname}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
      if (error) {
        return reject(error)
      }

      console.log(log_path, 'downloaded')

      if (MODE === MODES.RENEW) {
        exec(`gunzip -d ${__dirname}/solar*.gz`, (_error, _stdout, _stderr) =>
          // if (_error) {
          //   return reject(_error)
          // }
          resolve(true))
      } else {
        resolve(true)
      }
    })
  }))
}

module.exports = loadLogFromServer
