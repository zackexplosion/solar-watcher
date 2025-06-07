<template>
  <h1>hello!</h1>
  <div id="container"></div>
  <div id="firstContainer"></div>
  <div id="secondContainer"></div>
</template>

<script setup lang="ts">
import {
  createChart,
  // createTextWatermark,
  // LineSeries,
  CandlestickSeries,
} from "lightweight-charts"
import { onMounted } from 'vue'
import dayjs from 'dayjs'
// Lightweight Charts™ Example: Realtime updates
// https://tradingview.github.io/lightweight-charts/tutorials/demos/realtime-updates
let series: any = null

let lastCandle: any = null
class MyClass extends EventTarget {
  doSomething(payload: any) {
    console.log('payload', payload)
    // this.dispatchEvent(new Event('something', { data }));

  //     // {time: 1521288000, close: 3939.980133418763, open: 3828.2278263424905, low: 3529.3306971837615, high: 4582.059081897384}
//     if (update.done) {
//         clearInterval(intervalID);
//         return;
//     }

  const powerGenerated = Number.parseInt(payload.data[5])
  const time = dayjs(payload.createdAt)
  let update = {}
  let diff = 0


  if (lastCandle) {
    diff = time.diff( dayjs(lastCandle.time * 1000), 'minute')

    console.log('time', time.format())
    console.log('dayjs(lastCandle.time)', dayjs(lastCandle.time * 1000).format())
    console.log('diff', diff)
  }

  if (lastCandle && diff <= 1 ) {
    update = {
      time: lastCandle.time,
      close: powerGenerated,
      open: lastCandle.open,
      low: Math.min(lastCandle.low, powerGenerated),
      high: Math.max(lastCandle.high, powerGenerated),
    }
  } else {
    update = {
      time: time.unix(),
      close: powerGenerated,
      open: powerGenerated,
      low: powerGenerated,
      high: powerGenerated,
    }

    // lastCandle = update
  }

  lastCandle = update


//     const updateCandle = (candle, val) => ({
//         time: candle.time,
//         close: val,
//         open: candle.open,
//         low: Math.min(candle.low, val),
//         high: Math.max(candle.high, val),
//     });


    console.log(update)
    series.update(update);
  }
}

const instance = new MyClass();

onMounted(() => {
  const url = import.meta.env.VITE_APP_API_URL

  function connectToWebSocketServer() {
    let webSocket = new WebSocket(url)
    webSocket.onmessage = (event) => {

      // console.log(event)

      try {
        const data = JSON.parse(event.data)
        // console.log('data.channel', data.channel)

        if(data.channel === 'on-data-collected') {
          // onDateCollected(data)
          instance.doSomething(data.payload)
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

  let webSocket = connectToWebSocketServer()



  // const firstChart = createChart(document.getElementById('firstContainer'))
  // const secondChart = createChart(document.getElementById('secondContainer'))

//   let randomFactor = 25 + Math.random() * 25;
// const samplePoint = i =>
//     i *
//         (0.5 +
//             Math.sin(i / 1) * 0.2 +
//             Math.sin(i / 2) * 0.4 +
//             Math.sin(i / randomFactor) * 0.8 +
//             Math.sin(i / 50) * 0.5) +
//     200 +
//     i * 2;

// function generateData(
//     numberOfCandles = 500,
//     updatesPerCandle = 5,
//     startAt = 100
// ) {
//     const createCandle = (val, time) => ({
//         time,
//         open: val,
//         high: val,
//         low: val,
//         close: val,
//     });

//     const updateCandle = (candle, val) => ({
//         time: candle.time,
//         close: val,
//         open: candle.open,
//         low: Math.min(candle.low, val),
//         high: Math.max(candle.high, val),
//     });

//     randomFactor = 25 + Math.random() * 25;
//     const date = new Date(Date.UTC(2018, 0, 1, 12, 0, 0, 0));
//     const numberOfPoints = numberOfCandles * updatesPerCandle;
//     const initialData = [];
//     const realtimeUpdates = [];
//     let lastCandle;
//     let previousValue = samplePoint(-1);
//     for (let i = 0; i < numberOfPoints; ++i) {
//         if (i % updatesPerCandle === 0) {
//             date.setUTCDate(date.getUTCDate() + 1);
//         }
//         const time = date.getTime() / 1000;
//         let value = samplePoint(i);
//         const diff = (value - previousValue) * Math.random();
//         value = previousValue + diff;
//         previousValue = value;
//         if (i % updatesPerCandle === 0) {
//             const candle = createCandle(value, time);
//             lastCandle = candle;
//             if (i >= startAt) {
//                 realtimeUpdates.push(candle);
//             }
//         } else {
//             const newCandle = updateCandle(lastCandle, value);
//             lastCandle = newCandle;
//             if (i >= startAt) {
//                 realtimeUpdates.push(newCandle);
//             } else if ((i + 1) % updatesPerCandle === 0) {
//                 initialData.push(newCandle);
//             }
//         }
//     }

//     return {
//         initialData,
//         realtimeUpdates,
//     };
// }

const chartOptions = {
    layout: {
        textColor: 'black',
        background: { type: 'solid', color: 'white' },
    },
    height: 200,
};
const container = document.getElementById('container');
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(container, chartOptions);

// Only needed within demo page
// eslint-disable-next-line no-undef
window.addEventListener('resize', () => {
    chart.applyOptions({ height: 200 });
});

series = chart.addSeries(CandlestickSeries, {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderVisible: false,
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
});

// const data = generateData(2500, 20, 1000);

// series.setData(data.initialData);
chart.timeScale().fitContent();
chart.timeScale().scrollToPosition(5);

// simulate real-time data
function* getNextRealtimeUpdate(realtimeData) {
    for (const dataPoint of realtimeData) {
        yield dataPoint;
    }
    return null;
}
const streamingDataProvider = getNextRealtimeUpdate(data.realtimeUpdates);

// const intervalID = setInterval(() => {
//     const update = null
//     // const update = streamingDataProvider.next();

//     if(!update) return
//     // {time: 1521288000, close: 3939.980133418763, open: 3828.2278263424905, low: 3529.3306971837615, high: 4582.059081897384}
//     if (update.done) {
//         clearInterval(intervalID);
//         return;
//     }
//     // console.log(update.value)
//     series.update(update.value);
// }, 100);

const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        gap: 8px;
    }
    .buttons-container button {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,
            sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 510;
        line-height: 24px; /* 150% */
        letter-spacing: -0.32px;
        padding: 8px 24px;
        color: rgba(19, 23, 34, 1);
        background-color: rgba(240, 243, 250, 1);
        border-radius: 8px;
        cursor: pointer;
    }

    .buttons-container button:hover {
        background-color: rgba(224, 227, 235, 1);
    }

    .buttons-container button:active {
        background-color: rgba(209, 212, 220, 1);
    }
`;

  const stylesElement = document.createElement('style');
  stylesElement.innerHTML = styles;
  container?.appendChild(stylesElement);

  const buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add('buttons-container');
  const button = document.createElement('button');
  button.innerText = 'Go to realtime';
  button.addEventListener('click', () => chart.timeScale().scrollToRealTime());
  buttonsContainer.appendChild(button);

  container?.appendChild(buttonsContainer);  
})

</script>

<style scoped>
  #container {
    width: 100%;
    height: 100%;
    min-width: 320px;
    min-height: 100vh;
  }
</style>