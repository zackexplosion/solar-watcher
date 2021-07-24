<template>
  <Chart
    v-if="ready"
    :constructorType="'stockChart'"
    :options="chartOptions"
    ref="chart"
    :updateArgs="updateArgs"
    style="height:100%;"
  />
</template>

<script>
import { Chart } from 'highcharts-vue'
import Highcharts from 'highcharts'
import stockInit from 'highcharts/modules/stock'

import darkUnica from 'highcharts/themes/dark-unica';

darkUnica(Highcharts)
stockInit(Highcharts)

const paramsArrayMap = [
  'timestamp', // 0
  'gridVoltage', 'gridFrequency',
  'acOutputVoltage', 'acOutputFrequency',
  'acOutputApparentPower', 'acOutputActivePower',
  'acOutputLoad', // 7
  'busVoltage', 'batteryVoltage',
  'batteryChargingCurrent', 'batteryCapacity',
  'heatSinkTemp', // 12
  'pvInputCurrent', 'pvInputVoltage',
  'pvBatteryVoltage',
  'batteryDischargeCurrent', // 16
  'flags', // 17
  'batteryVoltageOffset',
  'EEPRomVersion',
  'pvInputPower', // 20
]
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
      title: '太陽能監控儀',
      xAxis: {
        type: 'datetime',
      },
      yAxis: [
        {
          labels: {
            align: 'left',
          },
          height: '55%',
          resize: {
            enabled: true,
          },
          padding: 50,
        },
        {
          title: '電池',
          labels: {
            align: 'left',
          },
          top: '55%',
          height: '30%',
          offset: 0,
          padding: 50,
        },
        {
          labels: {
            align: 'left',
          },
          top: '85%',
          height: '15%',
          offset: 0,
          padding: 50,
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
        selected: 1, // all
      },
      tooltip: {
        shape: 'square',
        headerShape: 'callout',
        borderWidth: 0,
        shadow: false,
        valueDecimals: 1,
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
          key: 'pvInputPower',
          color: '#009933',
        },
        {
          name: '市電電壓 (伏特 V)',
          key: 'gridVoltage',
        },
        {
          name: 'AC負載 (瓦特 W)',
          key: 'acOutputActivePower',
          color: '#cc3333',
        },
        {
          name: 'AC電壓 (瓦特 V)',
          key: 'acOutputVoltage',
          color: '#cc3333',
        },
        {
          name: 'PV電流 (安培 A)',
          key: 'pvInputCurrent',
          yAxis: 1,
        },
        {
          name: 'PV電壓 (伏特 V)',
          key: 'pvInputVoltage',
          color: '#000099',
          // yAxis: 1,
        },
        {
          name: '電池電壓 (伏特 V)',
          key: 'batteryVoltage',
          color: '#000000',
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '電池容量 (%)',
          key: 'batteryCapacity',
          color: '#CCCCCC',
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '電池電流 (安培 A)',
          key: 'batteryChargingCurrent',
          color: '#666666',
          // type: 'column',
          yAxis: 1,
        },
        {
          name: '散熱器溫度 (攝氏 °C)',
          key: 'heatSinkTemp',
          color: '#ffcc00',
          yAxis: 1,
        },
      ],
    },
  }),
  methods: {
    setup() {
      const { socket } = this.$store.state

      socket.on('connect', () => {
        console.log('websocket connected')
      })

      socket.on('initLiveChart', (data) => {
        // console.log(data)
        // clean data
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          this.chartOptions.series[index].data = []
        }
        data.forEach((d) => {
          const t = d[0]
          for (let index = 0; index < this.chartOptions.series.length; index += 1) {
            const { key } = this.chartOptions.series[index]
            const v = d[paramsArrayMap.indexOf(key)] || 0
            this.chartOptions.series[index].data.push([t, v])
          }
        })
        this.ready = true
        this.$emit('ready', true)
      })

      socket.on('updateLiveChart', (data) => {
        // console.log('updateChart', data)
        // this.chartOptions.series[0].addPoint(data.acOutputPower)
        const updatedData = []
        for (let index = 0; index < this.chartOptions.series.length; index += 1) {
          let updateChart = false
          const { key } = this.chartOptions.series[index]
          const value = data[paramsArrayMap.indexOf(key)]
          updatedData.push([key, value])
          if (index === this.chartOptions.series.length - 1) {
            updateChart = true
          }

          this.$refs.chart.chart.series[index].addPoint(
            [data[0], value],
            updateChart,
            true,
          )
        }

        // console.log(updatedData)
      })
    },
  },
};
</script>
