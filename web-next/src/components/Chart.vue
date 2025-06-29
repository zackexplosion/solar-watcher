<template>
  <div id="container"></div>
</template>

<script setup lang="ts">
import {
  createChart,
  type IChartApi,
  // createTextWatermark,
  // LineSeries,
  CandlestickSeries,
} from "lightweight-charts"
import {
  onMounted,
  onUnmounted
} from 'vue'
import dayjs from 'dayjs'
// Lightweight Charts™ Example: Realtime updates
// https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates

import dataParams from '../data-params'

let chart: IChartApi | null = null
const chartHeight = window.innerHeight

interface SeriesKeysInterface {
  label: string
  legendLabel: string
  color: string
  type: any
  paneIndex: number
}

const { 
  seriesKeys
} = defineProps({
  seriesKeys: {
    type: Array<SeriesKeysInterface>,
    default: () => []
  }
})



// const seriesKeys: any = props.seriesKeys

let seriesMap: any = {}

interface Payload {
  data: string[]
  createdAt: Date  
}
let lastInitCandleTime: number = 0
function updateSeries(seriesKey: string, payload: Payload) {
  let update = {}
  let diff = 0

  const index = dataParams.indexOf(seriesKey)
  const value = Number.parseFloat(payload.data[index]) || 0
  const time = dayjs(payload.createdAt)

  if(!seriesMap[seriesKey] && !seriesMap[seriesKey].lastCandle) {
    seriesMap[seriesKey].lastCandle = null
  }

  let lastCandle = seriesMap[seriesKey].lastCandle

  if (lastCandle) {
    diff = time.diff( dayjs(lastInitCandleTime * 1000), 'minute')
  }

  // console.log('time', time.format())
  // console.log('lastInitCandleTime', lastInitCandleTime)
  // console.log('diff', diff)

  if (lastCandle && diff <= 10 ) {
    update = {
      time: lastCandle.time,
      value: value,
      close: value,
      open: lastCandle.open,
      low: Math.min(lastCandle.low, value),
      high: Math.max(lastCandle.high, value),
    }
  } else {
    update = {
      time: time.add(8, 'hours').unix(),
      value: value,
      close: value,
      open: value,
      low: value,
      high: value,
    }
  }

  seriesMap[seriesKey].lastCandle = update

  if(seriesMap[seriesKey].series) {
    seriesMap[seriesKey].series.update(update)
  }
}

interface InitChartPayloadItem {
  timestamp: Date
  data: any
}

onMounted(() => {
  const url = import.meta.env.VITE_APP_API_URL

  function connectToWebSocketServer() {

    console.log('connectToWebSocketServer')
    let webSocket = new WebSocket(url)

    let isChartInit = false

    webSocket.onmessage = (event) => {

      try {
        const data = JSON.parse(event.data)
        switch(data.channel) {
          case 'on-data-collected':
            if (!isChartInit) {
              break
            }
            seriesKeys.forEach(_ => {
              updateSeries(_.label, data.payload)
            })
            break;
          case 'on-data-processed':
          case 'initial-chart':
            console.log('initial-chart')
            if(!Array.isArray(data.payload)) return 

            // console.log('payload', data.payload)

            const dataToInit: any = {}

            seriesKeys.forEach(_ => {
              dataToInit[_.label] = []
            })

            data.payload.forEach( (__:InitChartPayloadItem) => {
              
              // let lastAddedTime: number | null = null
              seriesKeys.forEach(_ => {

                
                const data = __.data[_.label]
                data.time = dayjs(__.timestamp).add(8, 'hours').unix()
                data.value = __.data[_.label].avg

                lastInitCandleTime = data.time

                // const data = {
                //   time: dayjs(__.timestamp).add(8, 'hours').unix(),
                //   value: __.data[_.label].avg
                // }

                // console.log('data.time', data.time)

                dataToInit[_.label].push(data)
              })
            })

            // console.log('dataToInit', dataToInit)

            seriesKeys.forEach(_ => {
              seriesMap[_.label].series.setData(dataToInit[_.label])
            })

            isChartInit = true

            break
          default:
            break
        }


      } catch (error) {
        console.log(error)
      }
    }

    webSocket.onclose = (event) => {
      // retry connections
      console.log(event)

      setTimeout(() => {
        webSocket = connectToWebSocketServer()  
      }, 500)
    }

    return webSocket
  }

  const chartOptions: any = {
    // layout: {
    //     textColor: 'black',
    //     background: { type: 'solid', color: 'white' },
    // },
    layout: {
      background: { color: "#222" },
      textColor: "#DDD",
    },
    grid: {
      vertLines: { color: "#444" },
      horzLines: { color: "#444" },
    },
    rightOffset: 200,
    height: chartHeight,
    timeScale: {
      timeVisible: true,
      rightOffset: 30,
      // fixLeftEdge: true,
      barSpacing: 5
    },
    localization: {
      locale: "zh-TW",
      dateFormat: "yyyy-MM-dd",
    },
  }

  const container = document.getElementById('container')

  if(!container) return




  chart = createChart(container, chartOptions)




  const legend = document.createElement('id')
  legend.id = 'legend'
  // legend.style = `position: absolute; right: 12px; top: 12px; z-index: 1; font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 300;`
  container.appendChild(legend)

  // const setTooltipHtml = () => {
  //   // legend.innerHTML = `<div>${name}</div>
  //   // <div style="font-size: 22px; margin: 4px 0px;">${price}</div><div>${date}</div>`;
  //   legend.innerHTML = '<div>'
  //   seriesKeys.forEach(_ => {
  //     legend.innerHTML.replace('name', _.legendLabel);
  //   })
  // }

  const updateLegend = (param: any) => {

    const validCrosshairPoint = !(
        param === undefined || param.time === undefined || param.point.x < 0 || param.point.y < 0
    )

    if(!validCrosshairPoint) return
    // console.log('param', param.seriesData)

    // debugger
    // const bar = validCrosshairPoint ? param.seriesData.get(areaSeries) : getLastBar(areaSeries);
    // // time is in the same format that you supplied to the setData method,
    // // which in this case is YYYY-MM-DD
    // const time = bar.time;
    // const price = bar.value !== undefined ? bar.value : bar.close;
    // const formattedPrice = formatPrice(price);
    // setTooltipHtml(param.seriesData);
    let html = ''

    seriesKeys.forEach((_, index) => {
      const data = param.seriesData.get(seriesMap[_.label].series)
      // console.log('data', data)

      if(!data || Number.isNaN(data.value)) return

      // if(_.label === 'batteryVoltage') {
      //   data.value = (data.open + data.close) / 2
      // }


      try {

        if (_.type === CandlestickSeries) {
          data.value = `<br />H:${data.high}, L:${data.low}, O:${data.open}, C:${data.close}`
        } else {
          data.value = data.value.toFixed(2)
        }
        html += `<li><span style="color: ${seriesKeys[index].color}">${seriesKeys[index].legendLabel}: ${data.value}</span></li>`        
      } catch (error) {
        console.error(error)
      }
    })

    legend.innerHTML = html
  }

  chart.subscribeCrosshairMove(updateLegend)

  updateLegend(undefined)

  // Only needed within demo page
  // eslint-disable-next-line no-undef
  window.addEventListener('resize', () => {
    chart?.applyOptions({ 
      width: window.innerWidth,
      height: window.innerHeight,
    })
  })

  for (let index = 0; index < seriesKeys.length; index++) {
    const {
      label,
      color,
      paneIndex,
      type
    } = seriesKeys[index]

    let series = null


    if(type === CandlestickSeries) {
      series = chart.addSeries(type, {
        upColor: color,
        downColor: color,
        borderVisible: false,
        wickUpColor: color,
        wickDownColor: color,
      }, paneIndex)
    } else {
      series = chart.addSeries(type, {
        color: color
      }, paneIndex)
    }

    seriesMap[label] = {
      lastCandle: null,
      series: series
    }    
  }

  chart.timeScale().fitContent();

  connectToWebSocketServer()
})

onUnmounted(() => {
  if (chart) {
    chart.remove();
    chart = null;
  }
  
  // Reload every 11 minutes
  setTimeout( () => {
    window.location.reload()
  }, 1000 * 60 * 1.1)
});
</script>

<style scoped>
  #container {
    width: 100%;
    height: 100%;
    min-width: 320px;
    min-height: 100vh;
  }


</style>

<style>
  #legend {
    position: absolute;
    right: 6em;
    top: 1em;
    z-index: 1000;
    font-size: 14px;
    font-family: sans-serif;
    line-height: 18px;
    font-weight: bold;
    text-align: left;
    list-style: none;
  }
</style>