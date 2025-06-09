<template>
  <div id="container"></div>
</template>

<script setup lang="ts">
import {
  createChart,
  type IChartApi,
  // createTextWatermark,
  LineSeries,
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
// const props = defineProps({
//   seriesKeys: {
//     type: Array,
//     default: []
//   }
// })

const seriesKeys = [
  {
    label: 'acOutputActivePower',
    legendLabel: 'AC 輸出功率',
    color: '#da0808',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'pvInputPower',
    legendLabel: 'PV 輸入功率',
    color: '#08da4a',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'pvInputVoltage',
    legendLabel: 'PV 輸入電壓',
    color: '#1d7fa2',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'batteryVoltage',
    legendLabel: '電池電壓',
    color: '#ffeb00',
    type: CandlestickSeries,
    paneIndex: 1
  },
]

// const seriesKeys: any = props.seriesKeys

let seriesMap: any = {}

interface Payload {
  data: string[]
  createdAt: Date  
}

function updateSeries(seriesKey: string, payload: Payload) {
  let update = {}
  let diff = 0

  const index = dataParams.indexOf(seriesKey)
  const value = Number.parseFloat(payload.data[index])
  const time = dayjs(payload.createdAt)

  if(!seriesMap[seriesKey] && !seriesMap[seriesKey].lastCandle) {
    seriesMap[seriesKey].lastCandle = null
  }

  let lastCandle = seriesMap[seriesKey].lastCandle

  if (lastCandle) {
    diff = time.diff( dayjs(lastCandle.time * 1000), 'minute')
  }

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

onMounted(() => {
  const url = import.meta.env.VITE_APP_API_URL

  function connectToWebSocketServer() {
    let webSocket = new WebSocket(url)
    webSocket.onmessage = (event) => {

      // console.log(event)

      try {
        const data = JSON.parse(event.data)
        switch(data.channel) {
          case 'on-data-collected':
            seriesKeys.forEach(_ => {
              updateSeries(_.label, data.payload)
            })
            break;
          case 'initial-chart':

            console.log('data', data)

            if(!Array.isArray(data.payload)) return 

            const dataToInit: any = {}

            seriesKeys.forEach(_ => {
              dataToInit[_.label] = []
            })

            data.payload.forEach( __ => {
              
              seriesKeys.forEach(_ => {
                const data = __.data[_.label]
                data.time = dayjs(__.timestamp).add(8, 'hours').unix()
                data.value = __.data[_.label].avg

                // const data = {
                //   time: dayjs(__.timestamp).add(8, 'hours').unix(),
                //   value: __.data[_.label].avg
                // }
                dataToInit[_.label].push(data)
              })
            })

            console.log('dataToInit', dataToInit)

            seriesKeys.forEach(_ => {
              seriesMap[_.label].series.setData(dataToInit[_.label])
            })

            break;
          default:
            break;
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

      if(_.label === 'batteryVoltage') {
        data.value = (data.open + data.close) / 2
      } 

      data.value = data.value.toFixed(2)
      html += `<li><span style="color: ${seriesKeys[index].color}">${seriesKeys[index].legendLabel}: ${data.value}</span></li>`
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
  // chart.timeScale().scrollToPosition(5);

  connectToWebSocketServer()
})

onUnmounted(() => {
  if (chart) {
      chart.remove();
      chart = null;
  }
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