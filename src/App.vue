<template>
  <div id="app">
    <div v-if="!ready">Loading...</div>
    <div v-if="ready">
      <!-- <h1>Message From Server: {{msgFromServer}}</h1> -->
      <h1>即時負載(W 瓦特)，最近五分鐘，每五秒更新</h1>
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
      title: '目前負載',
      xAxis: {
        type: 'datetime',
      },
      yAxis: {
        title: {
          enabled: true,
          text: '瓦特 (W)',
          // style: {
          //   fontWeight: 'normal',
          // },
        },
      },
      series: [
        {
          name: 'AC負載',
          color: '#cc3333',
          data: [], // sample data
        },
        {
          name: 'PV輸入',
          color: '#009933',
          data: [], // sample data
        },
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
          if (d.acOutputPower && d.pvInputPower) {
            const power = parseFloat(d.acOutputPower)
            this.chartOptions.series[0].data.push([t, power])

            const pvPower = parseFloat(d.pvInputPower)
            this.chartOptions.series[1].data.push([t, pvPower])
          } else {
            console.log(d)
          }
        })
        this.ready = true
      })

      socket.on('updateLiveChart', (data) => {
        console.log('updateChart', data)
        // this.chartOptions.series[0].addPoint(data.acOutputPower)

        this.$refs.chart.chart.series[0].addPoint(
          [data.timestamp, data.acOutputPower],
          false,
          true,
        );

        this.$refs.chart.chart.series[1].addPoint(
          [data.timestamp, data.pvInputPower],
          true,
          true,
        );

        // this.$refs.chart.chart.series[0].data.shift()
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

}
h1 {
  text-align: center;
}
</style>
