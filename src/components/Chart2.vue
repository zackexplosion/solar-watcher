<template>
  <div id="chart">
    <div class="container" ref="lightweightChart">
      <div class="legend">
        <div class="acOutputActivePower">負載：{{crosshairCurrentAcOutputActivePower}}</div>
        <div class="pvInputPower">發電：{{crosshairCurrentPVPower}}</div>
        <div class="date">時間：{{crosshairCurrentTime}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { isBusinessDay, createChart, TickMarkType } from 'lightweight-charts'
import dayjs from 'dayjs'
import paramsArrayMap from '../../server/paramsArrayMap'

console.log('LightweightCharts', TickMarkType)

const DATE_FORMAT = 'YYYY/MM/DD HH:mm'

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
    color: '#1d9bd5',
  },
]

export default {
  name: 'Chart',
  data: () => ({
    chart: null,
    crosshairCurrentAcOutputActivePower: 0,
    crosshairCurrentPVPower: 0,
    crosshairCurrentTime: dayjs().format(DATE_FORMAT),
  }),
  mounted() {
    const container = this.$refs.lightweightChart
    const chart = createChart(container, {
      layout: {
        backgroundColor: '#111111',
        lineColor: '#2B2B43',
        textColor: '#ccc',
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          // console.log('time', time)
          const date = dayjs(time)
          console.log(isBusinessDay(time))
          if (isBusinessDay(time)) {
            return ''
          }
          switch (tickMarkType) {
            case TickMarkType.Year:
              return date.format('MM/DD')
            case TickMarkType.Month:
              return date.format('hh:mm')
            case TickMarkType.DayOfMonth:
              return date.format('DD')
            case TickMarkType.Time:
              return date.format('hh:ss')
            case TickMarkType.TimeWithSeconds:
              return date.format('hh:mm:ss')

            default:
              return date.format(DATE_FORMAT)
          }

          // return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
      localization: {
        timeFormatter: (time) => {
          if (isBusinessDay(time)) {
            return '';
          }
          return dayjs(time).format(DATE_FORMAT);
        },
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
    })

    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined) return
      const time = dayjs(param.time)
      this.crosshairCurrentTime = time.format(DATE_FORMAT)
      this.crosshairCurrentPVPower = param.seriesPrices.get(_series[0])
      this.crosshairCurrentAcOutputActivePower = param.seriesPrices.get(_series[1])

      // const a = param.seriesPrices.get(_series[0])

      // debugger
      // dateStr = `${param.time.year} - ${param.time.month} - ${param.time.day}`;
      // const price = param.seriesPrices.get(series)
      // toolTip.innerHTML =	`<div style="font-size: 24px; margin: 4px 0px; color: #20262E"> AEROSPACE</div><div style="font-size: 22px; margin: 4px 0px; color: #20262E">${(Math.round(price * 100) / 100).toFixed(2)}</div><div>${dateStr}</div>`
    })

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
      let h = window.innerHeight - 400

      if (window.innerWidth <= 768) {
        h = window.innerHeight - 300
      }

      // console.log('h', h)
      this.chart.applyOptions({
        width: w,
        height: h,
      })
    },
  },
}
</script>

<style>
#chart {
  position: absolute;
  bottom: 1em;
}

.container {
  position: relative;
}

.legend {
  width: 35%;
  height: 70px;
  position: absolute;
  padding: 8px;
  font-size: 12px;
  /* color: '#20262E'; */
  color: #ccc;
  background-color: rgba(255, 255, 255, 0.23);
  text-align: left;
  z-index: 1000;
  pointer-events: none;
}

@media  (min-width: 768px) {

  .legend {
    width: 15%;
  }
}

</style>
