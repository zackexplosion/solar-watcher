<template>
  <div v-show="ready">
    <div class="gauges" ref="gauges" />
  </div>
</template>

<script>
import { RadialGauge } from 'canvas-gauges'
import dayjs from 'dayjs'
import Big from 'big.js'

export default {
  name: 'Gauges',

  data: () => ({
    ready: false,
  }),
  mounted() {
    // const radial = new RadialGauge({
    //   renderTo: document.createElement('canvas'),
    // })
    const { socket } = this.$store.state

    // const g_powerGeneratedToday = this.createGauge({
    //   majorTicks: [0, 5, 10, 15],
    //   units: '度',
    //   minValue: 0,
    //   maxValue: 15,
    //   valueInt: 1,
    //   valueDec: 2,
    //   title: '今日發電',
    // })

    // const g_powerOutputToday = this.createGauge({
    //   majorTicks: [0, 10, 20, 30, 40, 50],
    //   units: '度',
    //   value: 0,
    //   minValue: 0,
    //   maxValue: 50,
    //   valueInt: 1,
    //   valueDec: 2,
    //   title: '今日用電',
    // })

    const g_pvInputPower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
      units: 'Watt',
      value: 0,
      valueDec: 0,
      minValue: 0,
      maxValue: 3000,
      title: '即時發電',
    })

    const g_acOutputActivePower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
      units: 'Watt',
      value: 0,
      valueDec: 0,
      minValue: 0,
      maxValue: 3000,
      title: '即時負載',
    })

    // const g_gridVoltage = this.createGauge({
    //   majorTicks: [200, 210, 220, 230, 240, 250],
    //   units: 'Voltage',
    //   value: 220,
    //   minValue: 200,
    //   maxValue: 250,
    //   title: '市電電壓',
    // })

    const g_pvInputVoltage = this.createGauge({
      majorTicks: [0, 50, 100, 150, 200, 250, 300],
      units: 'Voltage',
      minValue: 0,
      maxValue: 300,
      title: 'PV電壓',
    })

    // const g_pvInputCurrent = this.createGauge({
    //   majorTicks: [0, 20],
    //   units: 'Ampere',
    //   minValue: 0,
    //   maxValue: 20,
    //   title: 'PV電流',
    // })

    // const g_acOutputVoltage = this.createGauge({
    //   majorTicks: [200, 210, 220, 230, 240, 250],
    //   units: 'Voltage',
    //   value: 220,
    //   minValue: 200,
    //   maxValue: 250,
    //   title: '輸出電壓',
    // })

    const g_batteryVoltage = this.createGauge({
      majorTicks: [40, 45, 50, 55, 60],
      units: 'Voltage',
      value: 48,
      minValue: 40,
      maxValue: 60,
      valueInt: 2,
      title: '電池電壓',
    })

    // const gauges = [
    //   'gridVoltage',
    //   'acOutputActivePower',
    //   'acOutputVoltage',
    //   'pvInputPower',
    //   'batteryVoltage',
    //   'powerGeneratedToday',
    // ]

    function setupGauge(data) {
      const [
        timestamp,
        gridVoltage, gridFrequency,
        acOutputVoltage, acOutputFrequency,
        acOutputApparentPower, acOutputActivePower,
        acOutputLoad,
        busVoltage, batteryVoltage,
        batteryChargingCurrent, batteryCapacity,
        heatSinkTemp,
        pvInputCurrent, pvInputVoltage,
        pvBatteryVoltage,
        batteryDischargeCurrent,
        flags,
        batteryVoltageOffset,
        EEPRomVersion,
        pvInputPower,
      ] = data
      // g_gridVoltage.value = gridVoltage
      g_acOutputActivePower.value = acOutputActivePower
      // g_acOutputVoltage.value = acOutputVoltage
      g_pvInputPower.value = pvInputPower
      g_batteryVoltage.value = batteryVoltage
      g_pvInputVoltage.value = pvInputVoltage
      // g_pvInputCurrent.value = pvInputCurrent

      document.querySelectorAll('.gauges canvas').forEach((_) => _.removeAttribute('style'))

      document.querySelector('.gauges').style = 'display:flex'
    }

    socket.emit('initLiveChart', (_data) => {
      const data = _data[_data.length - 1]
      setupGauge(data)
    })

    socket.on('updateLiveChart', (data) => {
      if (!this.ready) return
      setupGauge(data)
      const acOutputActivePower = data[6]
      const pvInputPower = data[20]

      // update powerGenerated
      if (pvInputPower) {
        let powerGenerated = Big(pvInputPower).div(3600).div(1000).toNumber()
        powerGenerated = Number.parseFloat(powerGenerated.toFixed(2))
        // g_powerGeneratedToday.value = Number.parseFloat(g_powerGeneratedToday.value)
        + powerGenerated
      }

      if (acOutputActivePower) {
        let p = Big(acOutputActivePower).div(3600).div(1000).toNumber()
        p = Number.parseFloat(p.toFixed(2))
        // g_powerOutputToday.value = Number.parseFloat(g_powerOutputToday.value) + p
      }
    })

    socket.on('setChartData', (data) => {
      // console.time('count pv power')
      let powerGeneratedToday = Big(0)
      let powerOutputToday = Big(0)
      const d1 = dayjs().startOf('date')
      console.log('d1', d1.format())
      data.forEach((_) => {
        const d2 = dayjs(_[0])
        const diff = d2.diff(d1)
        if (diff < 0) return

        if (_[20]) {
          const pvInputPower = Big(_[20]).div(12).div(1000)
          powerGeneratedToday = powerGeneratedToday.plus(pvInputPower)
        }

        if (_[6]) {
          const acOutputActivePower = Big(_[6]).div(12).div(1000)
          powerOutputToday = powerOutputToday.plus(acOutputActivePower)
        }
      })

      // powerGeneratedToday = Number.parseFloat(powerGeneratedToday.toFixed(2))
      // g_powerGeneratedToday.value = powerGeneratedToday

      // powerOutputToday = Number.parseFloat(powerOutputToday.toFixed(2))
      // g_powerOutputToday.value = powerOutputToday

      this.ready = true
    })
  },
  methods: {
    createGauge(options = {}) {
      let size = 400

      if (window.innerWidth <= size) {
        size = window.innerWidth - 30
      }

      const gauge = new RadialGauge({
        renderTo: document.createElement('canvas'),
        // fontValue: '',
        barWidth: 10,
        barShadow: 0,
        colorPlate: 'rgba(0,0,0,.0)',
        colorBarProgress: 'rgba(200,50,50,.95)',
        // colorBar: '#eaa',
        colorMajorTicks: '#FFFFFF',
        colorNumbers: '#DDDDDD',
        colorValueText: '#DDDDDD',
        borderShadowWidth: 0,
        borderInnerWidth: 0,
        borderOuterWidth: 0,
        borderMiddleWidth: 0,
        highlights: false,
        colorValueBoxShadow: 0,
        colorValueBoxBackground: 'transparent',
        valueBoxBorderRadius: 0,
        valueBoxStroke: 0,
        valueTextShadow: 0,
        valueDec: 1,
        value: 0,
        fontNumbersSize: 15,
        // fontValueSize: 26,
        // fontUnitsSize: 20,
        needle: false,
        width: size,
        height: size,
        minorTicks: 3,
        ...options,
      }).draw()

      this.$refs.gauges.appendChild(gauge.options.renderTo)

      return gauge
    },
  },
};
</script>
<style lang="scss">
.gauges {
  display: none;
  justify-content: space-between;
  text-align: center;
  flex-wrap: wrap;
  canvas {
    margin: 0 auto;
    max-width: 35%;
    // height: 50%;
    // width: 50%;
  }
}

@media  (min-width: 768px) {
  .gauges {
    flex-wrap: wrap;
    // canvas {
    //   width: 50%;
    // }
  }
  .gauges canvas{
    max-width: 320px;
    width: 20%;
    flex-grow: 1;
  }
}
</style>
