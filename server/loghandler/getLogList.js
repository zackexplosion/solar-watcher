const glob = require('glob')

function getLogList() {
  return new Promise((resolve, reject) => {
    glob(`${__dirname}/*.log*`, {}, (err, files) => {
      if (err) return reject(err)

      const regex = /solar.log\.?(\d+)/

      // sort log files name, start from oldest
      files.sort((a, b) => {
        let _a = a.match(regex)
        if (_a && _a[1]) {
          _a = parseInt(_a[1])
        }

        let _b = b.match(regex)
        if (_b && _b[1]) {
          _b = parseInt(_b[1])
        }

        if (_a > _b) return -1
        if (_a < _b) return 1
      })

      return resolve(files)
    })
  })
}

module.exports = getLogList
