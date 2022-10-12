<template>
  <div class="chart">
    <div class="container" ref="lightweightChart">
      <div v-show="ready">
        <div class="legend">
          <div class="pvInputPower">發電：{{crosshairCurrentPVPower}} W</div>
          <div class="acOutputActivePower">負載：{{crosshairCurrentAcOutputActivePower}} W</div>
          <div class="pvInputPower">電壓：{{crosshairBatteryVoltage}} V</div>
          <div class="date">日期：{{crosshairCurrentTime.format('MM/DD')}}</div>
          <div class="date">時間：{{crosshairCurrentTime.format('hh:mm')}}</div>
        </div>
        <div class="go-to-realtime-button" v-show="goRealTimeButtonVisible" @click="onRealtimeButtonClicked()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6.5 1.5l5 5.5-5 5.5M3 4l2.5 3L3 10"></path></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  isBusinessDay, createChart, TickMarkType, PriceScaleMode,
} from 'lightweight-charts'
import dayjs from 'dayjs'
import paramsArrayMap from '../../server/paramsArrayMap'

// const button = document.createElement('div');
// button.className = 'go-to-realtime-button';
// button.style.left = `${chartWidth - width - 60}px`;
// button.style.top = `${chartHeight - height - 30}px`;
// button.style.color = '#4c525e';
// button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6.5 1.5l5 5.5-5 5.5M3 4l2.5 3L3 10"></path></svg>';
// document.body.appendChild(button);

// console.log('LightweightCharts', TickMarkType)

const DATE_FORMAT = 'YYYY/MM/DD HH:mm'
function lineChartCreator(options) {
  return {
    ...options,
    priceFormat: {
      precision: 1,
      minMove: 0.1,
    },
  }
}
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
  name: 'Chart',
  data: () => ({
    ready: false,
    chart: null,
    crosshairCurrentAcOutputActivePower: 0,
    crosshairCurrentPVPower: 0,
    crosshairBatteryVoltage: 0,
    crosshairCurrentTime: dayjs(),
    currentDate: null,
    goRealTimeButtonVisible: true,
  }),
  mounted() {
    const container = this.$refs.lightweightChart
    let chart

    const { socket } = this.$store.state

    socket.on('connect', () => {
      console.log('websocket connected')
      socket.emit('getChartData')
    })
    const _series = []

    let lastDate

    socket.on('setChartData', (data) => {
      this.resetChart()
      // console.log('setChartData', data.length)
      // let tickMarkFormatterIndex = 0
      chart = createChart(container, {
        layout: {
          backgroundColor: '#111111',
          lineColor: '#2B2B43',
          textColor: '#ccc',
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.05,
          },
        // mode: PriceScaleMode.Percentage,
        // borderColor: 'rgba(197, 203, 206, 0.4)',
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderVisible: false,
          // fixLeftEdge: true,
          // fixRightEdge: true,
          // rightOffset: 12,
          // barSpacing: 10,
          // rightBarStaysOnScroll: true,
          tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = dayjs(time)
            // tickMarkFormatterIndex += 1
            // console.log('date', date.format())
            if (isBusinessDay(time)) {
              return ''
            }
            switch (tickMarkType) {
              // case TickMarkType.Year:
              //   return date.format('MM/DD')
              // case TickMarkType.Month:
              //   return date.format('hh:mm')
              // case TickMarkType.DayOfMonth:
              //   return date.format('DD')
              // case TickMarkType.Time:
              //   return date.format('hh:ss')
              // case TickMarkType.TimeWithSeconds:
              //   return date.format('hh:mm:ss')
              default:
                return `${date.format('HH:mm')}`
            }

          // return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
        localization: {
          dateFormat: 'yyyy/MM/dd',
          timeFormatter: (time) => {
            if (isBusinessDay(time)) {
              return '';
            }
            return dayjs(time).format(DATE_FORMAT);
          },
        },
        // watermark: {
        //   text: '萬池王',
        //   visible: true,
        //   color: '#556',
        // },
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

      // clean data
      const _dataToApply = []
      for (let index = 0; index < series.length; index += 1) {
        const s = series[index]
        // const p = {
        //   ...s,
        //   title: s.name,
        //   color: s.color,
        // }

        const p = lineChartCreator(s)

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
        // console.log(e)
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

      this.goToRealtime()
    })

    // end of setChartData

    window.addEventListener('resize', (e) => {
      this.setChartSize()
    })

    // reload every 5 minutes
    setInterval(() => {
      // eslint-disable-next-line no-self-assign
      window.location = window.location
    }, 1000 * 60 * 5)
  },
  unmounted() {
    this.resetChart()
  },
  methods: {
    isMobile() {
      return window.innerWidth <= 768
    },
    resetChart() {
      const dom = document.querySelector('.tv-lightweight-charts')
      if (dom) {
        dom.remove()
      }
    },
    goToRealtime() {
      const scrollToPosition = 50

      if (!this.isMobile()) {
        // scrollToPosition = 20
        this.chart.timeScale().scrollToPosition(scrollToPosition);
      }
    },
    onRealtimeButtonClicked() {
      this.goToRealtime()
    },
    setChartSize() {
      // let dashboardHeight = document.querySelector('#dashboard').offsetHeight
      // dashboardHeight -= document.querySelector('#dashboard').offsetTop
      // const w = document.querySelector('#app').offsetWidth
      const w = document.querySelector('body').offsetWidth
      let h = window.innerHeight - 400

      if (this.isMobile()) {
        h = window.innerHeight - 300
      }

      if (!this.chart) return
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

.container {
  position: relative;
}

.legend {
  /* display: none; */
  width: 30%;
  height: 70px;
  position: absolute;
  padding: 8px;
  font-size: 0.6em;
  /* color: '#20262E'; */
  color: #ccc;
  /* background-color: rgba(255, 255, 255, 0.23); */
  text-align: left;
  z-index: 1000;
  pointer-events: none;
}

.go-to-realtime-button {
	width: 27px;
	height: 27px;
	position: absolute;
	padding: 7px;
	box-sizing: border-box;
	font-size: 10px;
	border-radius: 50%;
	text-align: center;
	z-index: 1000;
	color: #B2B5BE;
	background: rgba(250, 250, 250, 0.95);
	box-shadow: 0 2px 5px 0 rgba(117, 134, 150, 0.45);
  right: 8em;
  bottom: 4em;
}

@media  (min-width: 1024px) {
  .chart {
    position: absolute;
    bottom: 0;
  }

  .legend {
    /* display: block; */
    font-size: 1.2em;
    width: 15%;
  }
}

</style>
