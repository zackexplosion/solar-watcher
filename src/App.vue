<template>
  <div id="app">
    <div v-if="!ready">Loading...</div>
    <div v-if="ready">
      <!-- <h1>Message From Server: {{msgFromServer}}</h1> -->
      <h1>太陽能監控儀</h1>
      <div id="chart">
        <Chart :options="chartOptions" ref="chart" :updateArgs="updateArgs"/>
      </div>
    </div>

  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { Chart } from 'highcharts-vue'
// import stockInit from 'highcharts/modules/stock'

// stockInit(Chart)

export default {
  name: 'App',
  components: {
    Chart,
  },
  mounted() {
    this.setupSocket()
    setTimeout(() => {
      window.location = window.location.toString()
    }, 1000 * 60 * 5)
  },
  data: () => ({
    socket: null,
    ready: false,
    msgFromServer: '',
    updateArgs: [true, true],
    chartOptions: {
      time: {
        timezoneOffset: new Date().getTimezoneOffset(),
      },
      chart: {
        height: `${(window.innerHeight - 200)}px`,
      },
      title: '',
      xAxis: {
        type: 'datetime',
      },
      yAxis: {
        title: {
          enabled: false,
          // text: '瓦特 (W)',
          // style: {
          //   fontWeight: 'normal',
          // },
        },
      },
      series: [
        {
          name: 'AC負載 (瓦特 W）',
          color: '#cc3333',
          data: [], // sample data
        },
        {
          name: 'PV輸入 (瓦特 W）',
          color: '#009933',
          data: [], // sample data
        },
        {
          name: '電池電壓 (伏特 V)',
          // color: '#009933',
          data: [], // sample data
        },
        // {
        //   name: '散熱器溫度 (攝氏 °C)',
        //   // color: '#009933',
        //   data: [], // sample data
        // },
      ],
    },
  }),
  methods: {
    setupSocket() {
      const socket = io()

      socket.on('connect', () => {
        console.log('websocket connected')
      })

      socket.on('initLiveChart', (data) => {
        console.log('t1', data[0])
        // console.log('t2', data[1].timestamp)
        this.chartOptions.series[0].data = []
        data.forEach((d) => {
          const t = d.timestamp
          if (
            d.acOutputPower
            && d.pvInputPower
            && d.battVoltage
          ) {
            const power = parseFloat(d.acOutputPower)
            this.chartOptions.series[0].data.push([t, power])

            const pvPower = parseFloat(d.pvInputPower)
            this.chartOptions.series[1].data.push([t, pvPower])

            const battVoltage = parseFloat(d.battVoltage)
            this.chartOptions.series[2].data.push([t, battVoltage])

            // const heatsinkTemp = parseFloat(d.heatsinkTemp)
            // this.chartOptions.series[3].data.push([t, heatsinkTemp])
          } else {
            console.log(d)
          }
        })
        this.ready = true
      })

      socket.on('updateLiveChart', (data) => {
        // console.log('updateChart', data)
        // this.chartOptions.series[0].addPoint(data.acOutputPower)

        this.$refs.chart.chart.series[0].addPoint(
          [data.timestamp, data.acOutputPower],
          false,
          true,
        )

        this.$refs.chart.chart.series[1].addPoint(
          [data.timestamp, data.pvInputPower],
          false,
          true,
        )

        this.$refs.chart.chart.series[2].addPoint(
          [data.timestamp, data.battVoltage],
          true,
          true,
        )

        // this.$refs.chart.chart.series[3].addPoint(
        //   [data.timestamp, data.heatsinkTemp],
        //   true,
        //   true,
        // )
      })

      this.socket = socket
    },
  },
};
</script>

<style lang="scss">
#app {
  text-align: left;
  width: 95%;
  margin: 0 auto;
  margin-top: 40px;
  height: 95vh;
  overflow: hidden;
}
h1 {
  text-align: center;
}
</style>
