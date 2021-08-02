const LOG_PATH = './test.log'
// const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log'
const NginxParser = require('nginxparser')

const parser = new NginxParser('$remote_addr - - [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"')
const { exec } = require('child_process')
const parseLog = require('./parseLog')

exec(`tail  ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, async (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`)
  }

  const cacheLogs = stdout.split('\n')

  for (let index = cacheLogs.length - 1; index >= 0; index -= 1) {
    const line = cacheLogs[index]
    parser.parseLine(line, (log) => {
      const data = parseLog(log)
      console.log(data.length)
      // console.log(data)
    })
  }
})
