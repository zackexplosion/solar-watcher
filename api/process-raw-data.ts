import 'dotenv/config'
import getDBInstance from './db'
import dayjs from 'dayjs'
import dataParams from './data-params'
import eventEmitter from './event-emitter'

interface ProcessDataAndDeleteRawParams {
  deviceId: string
}

export default async function processDataAndDeleteRaw({
  deviceId
}: ProcessDataAndDeleteRawParams) {
  const db = await getDBInstance()

  const startFrom = await db.collection("raw-data")
    .findOne(
      {
        id: deviceId,
      },
      {
        sort: { createdAt: 1 },
      }
    )

  const d1 = dayjs(startFrom?.createdAt)
  const now = dayjs()
  const diff = now.diff(d1, 'minutes')

  // const nowMinute = now.get('minutes');
  // const nowIndex = Math.floor(nowMinute / 10);
  // console.log('now minute:', nowMinute, 'now 10-min interval index (0-5):', nowIndex);

  if (diff <= 10) {
    // console.log("Less than 10 minutes, skip")
    return {
      code: 'no_more_new_raw_data',
      message: 'No more new raw data'
    }
  }

  const d1Minute = d1.get('minutes')

  // we will divide each HOUR into 6 pieces (10-min interval)
  const d1Index = Math.floor(d1Minute / 10);

  // So we have to know the start time of this 10-min interval index first
  console.log('d1 minute:', d1Minute, 'd1 10-min interval index (0-5):', d1Index);


  // Set the data range to process
  const processFrom = d1.startOf('hour').add(d1Index * 10, 'minutes')
  const processEnd = processFrom.add(10, 'minutes')

  const dataToProcessQuery = {
    id: deviceId,
    createdAt: {
      $gte: processFrom.toDate(),
      $lte: processEnd.toDate(),
    }
  }

  const dataToProcess = await db.collection("raw-data")
    .find(
      dataToProcessQuery,
      {
        sort: { createdAt: 1 },
      }
    ).toArray()

  console.log('dataToProcess', dataToProcess.length)
  // console.log('dataToProcess', dataToProcess[dataToProcess.length - 1])


  const intervalSummaryData: any = {};
  const excludeKeys = [
    'flags',
    'EEPRomVersion'
  ]
  dataToProcess.forEach((item: any) => { // Removed async as it's not needed here for summary
    item.data.forEach((value: any, paramIndex: number) => {
      const key = dataParams[paramIndex]

      if (!key) { return } // Ensure key is valid


      const numericValue = Number.parseFloat(value)

      if (!intervalSummaryData[key]) {
        intervalSummaryData[key] = {
          avg: numericValue,
          open: numericValue,
          low: numericValue,
          high: numericValue,
        }
      }


      if (!isNaN(numericValue) && !excludeKeys.includes(key)) { // Ensure value is a number before adding
        intervalSummaryData[key] = {
          ...intervalSummaryData[key],
          avg: intervalSummaryData[key].avg + numericValue,
          close: numericValue,
          low: Math.min(numericValue, intervalSummaryData[key].low),
          high: Math.max(numericValue, intervalSummaryData[key].high),
        }
      } else {
        // For excludeKeys, keep the last record's value
        intervalSummaryData[key] = numericValue;
      }
    })
  })

  Object.keys(intervalSummaryData).forEach((key) => {
    if (intervalSummaryData[key] && !excludeKeys.includes(key)) {
      intervalSummaryData[key].avg = intervalSummaryData[key].avg / dataToProcess.length
    }
  })

  const inserted = await db.collection("processed-data").insertOne({
    id: deviceId,
    data: intervalSummaryData,
    timestamp: processEnd.toDate(),
    createdAt: new Date(),
  })

  console.log('inserted', inserted)

  await db.collection('raw-data').deleteMany(dataToProcessQuery)


  // console.log('Interval Summary Data:', intervalSummaryData);
}

async function processDataAndDeleteRawRunner() {
  try {
    const result = await processDataAndDeleteRaw({
      deviceId: process.env.DEVICE_ID || "",
    })

    eventEmitter.emit('data-processed', result)

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