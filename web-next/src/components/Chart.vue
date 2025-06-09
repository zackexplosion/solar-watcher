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
    color: '#da0808',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'pvInputPower',
    color: '#08da4a',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'pvInputVoltage',
    color: '#1d7fa2',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'batteryVoltage',
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
        // console.log('data.channel', data.channel)

        // if(data.channel === 'on-data-collected') {

        //   // const key = 'acOutputActivePower'

        //   // updateSeries('pvInputPower', data.payload)

        //   seriesKeys.forEach(_ => {
        //     updateSeries(_.label, data.payload)
        //   })
        // }

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

    // const series = chart.addSeries(CandlestickSeries, {
    //   upColor: color,
    //   downColor: color,
    //   borderVisible: false,
    //   wickUpColor: color,
    //   wickDownColor: color,
    // })

    seriesMap[label] = {
      lastCandle: null,
      series: series
    }    
  }

  // series.setData(data.initialData);
  chart.timeScale().fitContent();
  // chart.timeScale().scrollToPosition(5);

  // const styles = `
  //   .buttons-container {
  //       display: flex;
  //       flex-direction: row;
  //       gap: 8px;
  //   }
  //   .buttons-container button {
  //       all: initial;
  //       font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,
  //           sans-serif;
  //       font-size: 16px;
  //       font-style: normal;
  //       font-weight: 510;
  //       line-height: 24px; /* 150% */
  //       letter-spacing: -0.32px;
  //       padding: 8px 24px;
  //       color: rgba(19, 23, 34, 1);
  //       background-color: rgba(240, 243, 250, 1);
  //       border-radius: 8px;
  //       cursor: pointer;
  //   }

  //   .buttons-container button:hover {
  //       background-color: rgba(224, 227, 235, 1);
  //   }

  //   .buttons-container button:active {
  //       background-color: rgba(209, 212, 220, 1);
  //   }`;

  // const stylesElement = document.createElement('style');
  // stylesElement.innerHTML = styles;
  // container?.appendChild(stylesElement);

  // const buttonsContainer = document.createElement('div');
  // buttonsContainer.classList.add('buttons-container');
  // const button = document.createElement('button');
  // button.innerText = 'Go to realtime';
  // button.addEventListener('click', () => chart.timeScale().scrollToRealTime());
  // buttonsContainer.appendChild(button);

  // container?.appendChild(buttonsContainer);


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