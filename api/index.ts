import 'dotenv/config'
import './local-api-server'
import './public-api-server'

import processDataAndDeleteRaw from './process-raw-data'

async function processDataAndDeleteRawRunner() {
  try {
    const result = await processDataAndDeleteRaw({
      deviceId: process.env.DEVICE_ID || "",
    })

    if (result?.code === 'no_more_new_raw_data') {
      setTimeout(() => {
        processDataAndDeleteRawRunner()
      }, 60 * 1000)
    } else {
      processDataAndDeleteRawRunner()
    }
  } catch (error) {
    console.log(error)
  }
}

processDataAndDeleteRawRunner()