<template>
  <div v-if="ready">
    <Chart
      :constructorType="'stockChart'"
      :options="chartOptions"
      ref="chart"
      :updateArgs="updateArgs"
    />
  </div>
</template>

<script>
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'

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
    updateArgs: [true, true],
    chartOptions: {
      time: {
        timezoneOffset: new Date().getTimezoneOffset(),
      },
      chart: {
        // height: `${(window.innerHeight - 50)}px`,
      },
      title: '太陽能監控儀',
      xAxis: {
        type: 'datetime',
      },
      yAxis: [
        {
          labels: {
            align: 'left',
          },
          height: '50%',
          // resize: {
          //   enabled: true,
          // },
        },
        {
          labels: {
            align: 'left',
          },
          top: '50%',
          height: '50%',
          offset: 0,
        },
      ],
      rangeSelector: {
        buttons: [
          {
            type: 'minute',
            count: 5,
            text: '5m',
          },
          {
            type: 'minute',
            count: 15,
            text: '15m',
          },
          {
            type: 'hour',
            count: 1,
            text: '1h',
          },
          {
            type: 'hour',
            count: 4,
            text: '4h',
          },
          {
            type: 'hour',
            count: 12,
            text: '12h',
          },
          {
            type: 'day',
            count: 1,
            text: '1d',
          },
          {
            type: 'month',
            count: 1,
            text: '1m',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
          },
          {
            type: 'all',
            text: 'All',
          }],
        // inputEnabled: false, // it supports only days
        selected: 0, // all
      },
      series: [
        {

          name: 'AC負載 (瓦特 W)',
          key: 'acOutputPower',
          color: '#cc3333',
          data: [], // sample data
        },
        {
          name: 'PV功率 (瓦特 W)',
          key: 'pvInputPower',
          color: '#009933',
          data: [], // sample data
        },
        {
          name: 'PV電流 (安培 A)',
          key: 'pvInputCurrent',
          data: [], // sample data
          yAxis: 1,
        },
        {
          name: 'PV電壓 (伏特 V)',
          key: 'pvInputVoltage',
          color: '#000099',
          data: [], // sample data
          // yAxis: 1,
        },
        {
          name: '電池電壓 (伏特 V)',
          key: 'battVoltage',
          color: '#000000',
          data: [], // sample data
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '電池容量 (%)',
          key: 'battCapacity',
          color: '#CCCCCC',
          data: [], // sample data
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '電池電流 (安培 A)',
          key: 'battChargingCurrent',
          color: '#666666',
          data: [], // sample data
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '散熱器溫度 (攝氏 °C)',
          key: 'heatsinkTemp',
          color: '#ffcc00',
          data: [], // sample data
          yAxis: 1,
        },
      ],
    },
  }),
  methods: {
    setup() {
      const { socket } = this

      socket.on('connect', () => {
        console.log('websocket connected')
      })

      socket.on('initLiveChart', (data) => {
        // console.log('t1', data[0])
        // console.log('t2', data[1].timestamp)
        // this.chartOptions.series[0].data = []
        // this.chartOptions.series
        // clean data
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          this.chartOptions.series[index].data = []
        }
        data.forEach((d) => {
          const t = d.timestamp

          for (let index = 0; index < this.chartOptions.series.length; index += 1) {
            const { key } = this.chartOptions.series[index]
            // const v = parseFloat(d[key])
            const v = d[key]
            this.chartOptions.series[index].data.push([t, v])
          }
        })
        this.ready = true
        this.$emit('ready', true)
      })

      socket.on('updateLiveChart', (data) => {
        // console.log('updateChart', data)
        // this.chartOptions.series[0].addPoint(data.acOutputPower)

        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          let updateChart = false
          const { key } = this.chartOptions.series[index]

          if (index === this.chartOptions.series.length - 1) {
            updateChart = true
          }
          // console.log('index', index)
          // console.log('index2', this.chartOptions.series.length)

          // console.log(this.$refs.chart.chart.series[index])
          this.$refs.chart.chart.series[index].addPoint(
            [data.timestamp, data[key]],
            updateChart,
            true,
          )
        }
      })
    },
  },
};
</script>
