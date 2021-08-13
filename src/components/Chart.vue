<template>
  <div v-show="ready">
    <button @click="liveMode = true">Live</button>
    <button @click="liveMode = false">歷史資料</button>
    <Chart
      ref="chart"
      style="height:100%;min-height:600px;"
      :constructorType="'stockChart'"
      :options="chartOptions"
      :updateArgs="updateArgs"
    />
  </div>
</template>

<script>
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'

import paramsArrayMap from '../../server/paramsArrayMap'

// const paramsArrayMap = [
//   'timestamp', // 0
//   'gridVoltage', 'gridFrequency',
//   'acOutputVoltage', 'acOutputFrequency',
//   'acOutputApparentPower', 'acOutputActivePower',
//   'acOutputLoad', // 7
//   'busVoltage', 'batteryVoltage',
//   'batteryChargingCurrent', 'batteryCapacity',
//   'heatSinkTemp', // 12
//   'pvInputCurrent', 'pvInputVoltage',
//   'pvBatteryVoltage',
//   'batteryDischargeCurrent', // 16
//   'flags', // 17
//   'batteryVoltageOffset',
//   'EEPRomVersion',
//   'pvInputPower', // 20
// ]

// import darkUnica from 'highcharts/themes/dark-unica';

// darkUnica(Highcharts)
stockInit(Highcharts)

export default {
  name: 'mychart',
  components: {
    Chart,
  },
  mounted() {
    this.setup()
  },
  props: {
    socket: {
      type: Object,
    },
  },
  data: () => ({
    ready: false,
    liveMode: false,
    updateArgs: [true, true],
    chartOptions: {
      // panning: true,
      followPointer: true,
      time: {
        timezoneOffset: new Date().getTimezoneOffset(),
      },
      chart: {
        styledMode: true,
        colorCount: 20,
      },
      navigator: {
        adaptToUpdatedData: false,
      },
      title: '太陽能監控儀',
      xAxis: {
        type: 'datetime',
        events: {
          afterSetExtremes(e) {
            // console.log(e)
          },
        },
      },
      // yAxis: [
      //   {
      //     labels: {
      //       align: 'left',
      //     },
      //     height: '50%',
      //     resize: {
      //       enabled: true,
      //     },
      //   // padding: 50,
      //   },
      //   {
      //     title: '電池',
      //     labels: {
      //       align: 'left',
      //     },
      //     top: '50%',
      //     height: '50%',
      //     offset: 0,
      //   // padding: 50,
      //   },
      //   {
      //     labels: {
      //       align: 'left',
      //     },
      //     top: '85%',
      //     height: '15%',
      //     offset: 0,
      //     padding: 50,
      //   },
      // ],
      rangeSelector: {
        buttons: [
          // {
          //   type: 'minute',
          //   count: 5,
          //   text: '5m',
          // },
          {
            type: 'minute',
            count: 15,
            text: 'live',
            events: {
              click() {
                this.liveMode = true
              },
            },
          },
          // {
          //   type: 'hour',
          //   count: 1,
          //   text: '1h',
          //   events: {
          //     click() {
          //       this.liveMode = false
          //     },
          //   },
          // },
          // {
          //   type: 'hour',
          //   count: 4,
          //   text: '4h',
          //   events: {
          //     click() {
          //       this.liveMode = false
          //     },
          //   },
          // },
          // {
          //   type: 'hour',
          //   count: 12,
          //   text: '12h',
          //   events: {
          //     click() {
          //       this.liveMode = false
          //     },
          //   },
          // },
          {
            type: 'day',
            count: 1,
            text: '1d',
            events: {
              click() {
                this.liveMode = false
              },
            },
          },
          // {
          //   type: 'month',
          //   count: 1,
          //   text: '1m',
          //   events: {
          //     click() {
          //       this.liveMode = false
          //     },
          //   },
          // },
          // {
          //   type: 'year',
          //   count: 1,
          //   text: '1y',
          //   events: {
          //     click() {
          //       this.liveMode = false
          //     },
          //   },
          // },
          {
            type: 'all',
            text: 'All',
          }],
        inputEnabled: false, // it supports only days
        selected: 1, // 1d
      },
      tooltip: {
        shape: 'square',
        headerShape: 'callout',
        borderWidth: 0,
        shadow: false,
        valueDecimals: 1,
        followTouchMove: false,
        positioner(width, height, point) {
          const { chart } = this;
          let position;

          if (point.isHeader) {
            position = {
              x: Math.max(
              // Left side limit
                chart.plotLeft,
                Math.min(
                  point.plotX + chart.plotLeft - width / 2,
                  // Right side limit
                  chart.chartWidth - width - chart.marginRight,
                ),
              ),
              y: point.plotY,
            };
          } else {
            position = {
              x: point.series.chart.plotLeft,
              y: point.series.yAxis.top - chart.plotTop,
            };
          }

          return position;
        },
      },
      series: [
        {
          name: 'PV功率 (瓦特 W)',
          className: 'pvInputPower',
          color: 'green',
        },
        {
          name: '輸出負載 (瓦特 W)',
          className: 'acOutputActivePower',
          color: 'blue',
        },
        // {
        //   name: '市電電壓 (伏特 V)',
        //   className: 'gridVoltage',
        //   color: 'red',
        //   yAxis: 1,
        // },
        // {
        //   name: '輸出電壓 (伏特 V)',
        //   className: 'acOutputVoltage',
        //   color: 'blue',
        //   yAxis: 1,
        // },
        // {
        //   name: 'PV電流 (安培 A)',
        //   className: 'pvInputCurrent',
        //   yAxis: 1,
        // },
        {
          name: 'PV電壓 (伏特 V)',
          className: 'pvInputVoltage',
          // color: '#000099',
          // yAxis: 1,
        },
        // {
        //   name: '電池電壓 (伏特 V)',
        //   className: 'batteryVoltage',
        //   // color: '#000000',
        //   // type: 'column',
        //   yAxis: 1,
        // },
        // {
        //   name: '電池容量 (%)',
        //   className: 'batteryCapacity',
        //   color: '#CCCCCC',
        //   // type: 'column',
        //   yAxis: 1,
        // },
        // {
        //   name: '電池電流 (安培 A)',
        //   className: 'batteryChargingCurrent',
        //   color: '#666666',
        //   // type: 'column',
        //   yAxis: 1,
        // },
        // {
        //   name: '散熱器溫度 (攝氏 °C)',
        //   className: 'heatSinkTemp',
        //   // color: '#ffcc00',
        //   yAxis: 1,
        // },
      ],
    },
  }),
  watch: {
    liveMode(n, o) {
      const { socket } = this.$store.state
      // console.log('o, n', o, n)

      if (n) {
        socket.emit('getLiveChartData')
      } else {
        socket.emit('getChartData')
      }
    },
  },
  methods: {
    setup() {
      const { socket } = this.$store.state

      socket.on('connect', () => {
        console.log('websocket connected')
      })

      socket.emit('getChartData')

      socket.on('setChartData', (data) => {
        console.log('setChartData', data.length)
        // clean data
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          this.chartOptions.series[index].data = []
        }
        data.forEach((d) => {
          const t = d[0]
          for (let index = 0; index < this.chartOptions.series.length; index += 1) {
            const { className } = this.chartOptions.series[index]
            const v = d[paramsArrayMap.indexOf(className)] || 0
            this.chartOptions.series[index].data.push([t, v])
            // this.chartOptions.series[index].update()
          }
        })
        this.ready = true
        this.$emit('ready', true)
      })

      socket.on('setLiveChartData', (data) => {
        console.log('setLiveChartData', data.length)
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          this.chartOptions.series[index].data = []
        }

        data.forEach((d) => {
          const t = d[0]
          for (let index = 0; index < this.chartOptions.series.length; index += 1) {
            const { className } = this.chartOptions.series[index]
            const v = d[paramsArrayMap.indexOf(className)] || 0
            this.chartOptions.series[index].data.push([t, v])

            // this.chartOptions.series[index].update()
          }
        })
      })

      socket.on('updateLiveChart', (data) => {
        if (!this.ready || !this.liveMode) return
        // console.log('updateChart', data)
        // this.chartOptions.series[0].addPoint(data.acOutputPower)
        // const updatedData = []
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          let updateChart = false
          const { className } = this.chartOptions.series[index]
          const value = data[paramsArrayMap.indexOf(className)]
          // updatedData.push([className, value])
          if (index === this.chartOptions.series.length - 1) {
            updateChart = true
          }
          // console.log(updatedData)

          // this.$refs.chart.chart.series[index].data.shift()
          const dateToUpdate = [data[0], value]
          // console.log('dateToUpdate', className, dateToUpdate, updateChart)
          this.$refs.chart.chart.series[index].addPoint(
            dateToUpdate,
            updateChart,
            true,
          )
        }
      })
    },
  },
};
</script>

<style>
/* .highcharts-color-0 {
  color: red;
}
.highcharts-tracker-line {
  stroke: green;
} */
/* .pvInputPower {
  fill: rgb(38, 184, 9);
  stroke: rgb(38, 184, 9);
}

.acOutputActivePower {
  fill: rgb(10, 120, 247);
  stroke:rgb(10, 120, 247);
}
.heatSinkTemp {
  fill: orange;
  stroke:orange;
} */
</style>
