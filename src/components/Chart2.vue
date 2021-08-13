<template>
  <div class="chart" ref="lightweightChart"/>
</template>

<script>

import { createChart } from 'lightweight-charts'
import paramsArrayMap from '../../server/paramsArrayMap'

const series = [
  {
    name: 'PV功率 (瓦特 W)',
    className: 'pvInputPower',
    color: 'green',
  },
  {
    name: '輸出負載 (瓦特 W)',
    className: 'acOutputActivePower',
    color: '#CC0000',
  },
  {
    name: 'PV電壓 (伏特 V)',
    className: 'pvInputVoltage',
    color: '#000099',
  },
]

export default {
  name: 'Chart',
  data: () => ({
    chart: null,
  }),
  mounted() {
    const chart = createChart(this.$refs.lightweightChart, {
      // timeScale: {
      //   tickMarkFormatter: (time) => {
      //     // console.log('time', time)
      //     const date = new Date(time);
      //     return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      //   },
      // },
      layout: {
        backgroundColor: '#111111',
        lineColor: '#2B2B43',
        textColor: '#D9D9D9',
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0)',
      },
      crosshair: {
        color: '#758696',
      },
      grid: {
        vertLines: {
          color: '#2B2B43',
        },
        horzLines: {
          color: '#363C4E',
        },
      },
    })

    const { socket } = this.$store.state

    socket.on('connect', () => {
      console.log('websocket connected')
      socket.emit('getChartData')
    })
    const _series = []

    socket.on('setChartData', (data) => {
      // console.log('setChartData', data.length)
      // clean data
      const _dataToApply = []
      for (let index = 0; index < series.length; index += 1) {
        const s = series[index]
        _series[index] = chart.addLineSeries({
          title: s.name,
          color: s.color,
        })

        _dataToApply[index] = []
      }
      data.forEach((d) => {
        const t = d[0]
        for (let index = 0; index < series.length; index += 1) {
          const { className } = series[index]
          const v = d[paramsArrayMap.indexOf(className)] || 0

          _dataToApply[index].push({
            time: t,
            value: v,
          })
        }
      })

      for (let index = 0; index < series.length; index += 1) {
        _series[index].setData(_dataToApply[index])
      }

      this.ready = true
      this.$emit('ready', true)
      // chart.timeScale().fitContent();
    })

    // socket.on('updateLiveChart', (data) => {
    //   for (let index = 0; index < series.length; index += 1) {
    //     const { className } = series[index]
    //     const value = data[paramsArrayMap.indexOf(className)]
    //     const dateToUpdate = [data[0], value]
    //     _series[index].update(dateToUpdate)
    //   }
    // })

    this.chart = chart

    this.setChartSize()

    window.addEventListener('resize', (e) => {
      this.setChartSize()
    })
  },
  methods: {
    setChartSize() {
      // let dashboardHeight = document.querySelector('#dashboard').offsetHeight
      // dashboardHeight -= document.querySelector('#dashboard').offsetTop
      const w = document.querySelector('#app').offsetWidth
      const h = window.innerHeight - 400

      // console.log('h', h)
      this.chart.applyOptions({
        width: w,
        height: h,
      })
    },
  },
}
</script>

<style scoped>
.chart {
  position: absolute;
  bottom: 1em;
}
</style>
