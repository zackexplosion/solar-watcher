<template>
  <div class="chart">
    <Chart :series="series" @chartReady="chart => chartReady(chart)"/>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import Chart from './Chart.vue'
import paramsArrayMap from '../../server/paramsArrayMap'

const series = [
  {
    title: 'PV功率',
    className: 'pvInputPower',
    color: '#009900',
  },
  {
    title: '輸出負載',
    className: 'acOutputActivePower',
    color: '#CC0000',
  },
  {
    title: 'PV電壓',
    className: 'pvInputVoltage',
    color: '#1d9bd5',
  },
  {
    title: '電瓶電壓',
    className: 'batteryVoltage',
    color: '#CC9900',
    priceScaleId: 'batt',
    scaleMargins: {
      top: 0.4,
      bottom: 0,
    },
  },
]

export default {
  name: 'RealTimeChart',
  components: {
    Chart,
  },
  data: () => ({
    series,
  }),
  mounted() {

  },
  unmounted() {
  },
  methods: {
    chartReady(chart) {
      const { socket } = this.$store.state
      // const chart = this
      socket.on('connect', () => {
      // console.log('websocket connected')
        socket.emit('getChartData')
      })
      const _series = []

      let lastDate

      socket.on('setChartData', (data) => {
        this.resetChart()
        // console.log('setChartData', data.length)
        // let tickMarkFormatterIndex = 0

        // clean data
        const _dataToApply = []
        for (let index = 0; index < series.length; index += 1) {
          const s = series[index]
          const p = Chart.lineChartCreator(s)

          _series[index] = chart.addLineSeries(p)

          _dataToApply[index] = []
        }

        data.forEach((d) => {
          const t = d[0]

          lastDate = t
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

        chart.subscribeCrosshairMove((param) => {
          if (param.time === undefined) return
          const time = dayjs(param.time)
          this.crosshairCurrentTime = time
          this.crosshairCurrentPVPower = param.seriesPrices.get(_series[0])
          this.crosshairCurrentAcOutputActivePower = param.seriesPrices.get(_series[1])
          this.crosshairBatteryVoltage = param.seriesPrices.get(_series[3])
        })

        const timeScale = chart.timeScale()
        timeScale.subscribeVisibleTimeRangeChange((e) => {
          this.goRealTimeButtonVisible = timeScale.scrollPosition() < 0
        })

        // chart.timeScale().setVisibleLogicalRange({
        //   from: 0,
        //   to: 100,
        // })

        // const visibleRange = {
        //   from: dayjs(data[0][0]).unix(),
        //   to: dayjs().unix(),
        // }

        // console.log('visibleRange', visibleRange)

        // chart.timeScale().setVisibleRange(visibleRange)

        this.chart = chart
        this.setChartSize()

        let appendingNewData = false
        socket.on('updateLiveChart', (_data) => {
          if (appendingNewData) return
          for (let index = 0; index < series.length; index += 1) {
            const { className } = series[index]
            const v = _data[paramsArrayMap.indexOf(className)] || 0

            const dateToUpdate = {
              time: dayjs(lastDate).add(5, 'm').valueOf(),
              value: v,
            }
            _series[index].update(dateToUpdate)
          }
        })

        socket.on('appendDataToChart', (_data) => {
        // console.log(_data)
          appendingNewData = true
          for (let index = 0; index < series.length; index += 1) {
            const { className } = series[index]
            const v = _data[paramsArrayMap.indexOf(className)] || 0

            const dateToUpdate = {
              time: _data[0],
              value: v,
            }
            _series[index].update(dateToUpdate)
          }
          lastDate = _data[0]
          appendingNewData = false
        })
      })
    },
  },
}
</script>

<style>

</style>
