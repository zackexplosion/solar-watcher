const fetch = require('axios')

const BASE_URL = 'https://api2.hiveos.farm/api/v2';
const {
  HIVE_TOKEN,
  HIVE_FARM_ID,
  HIVE_WORKER_ID,
} = process.env

function controlMiner(action = 'restart') {
  console.log('controlMiner', action)
  return fetch.request(`${BASE_URL}/farms/${HIVE_FARM_ID}/workers/${HIVE_WORKER_ID}/command`, {
    headers: {
      Authorization: `Bearer ${HIVE_TOKEN}`,
    },
    data: {
      command: 'miner',
      data: { action },
    },
    method: 'POST',
  })
}

// async function main() {
//   try {
//     controlMiner('restart')
//   } catch (error) {

//   }
// }

// main()

module.exports = controlMiner
