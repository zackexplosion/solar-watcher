<template>
  <div class="gauges" ref="gauges" />
</template>

<script>
import { RadialGauge } from 'canvas-gauges'
import dayjs from 'dayjs'
import Big from 'big.js'

export default {
  name: 'Gauges',
  mounted() {
    // const radial = new RadialGauge({
    //   renderTo: document.createElement('canvas'),
    // })
    const { socket } = this.$store.state

    const g_powerGeneratedToday = this.createGauge({
      majorTicks: [0, 5, 10, 15],
      units: '度',
      minValue: 0,
      maxValue: 15,
      valueInt: 1,
      valueDec: 2,
      title: '今日已發電',
    })

    const g_pvInputPower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
      units: 'Watt',
      value: 0,
      minValue: 0,
      maxValue: 3000,
      title: '即時發電量',
    })

    const g_acOutputActivePower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
      units: 'Watt',
      value: 0,
      minValue: 0,
      maxValue: 3000,
      title: '輸出負載',
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
      value: 0,
      minValue: 0,
      maxValue: 300,
      title: 'PV電壓',
    })

    // const g_acOutputVoltage = this.createGauge({
    //   majorTicks: [200, 210, 220, 230, 240, 250],
    //   units: 'Voltage',
    //   value: 220,
    //   minValue: 200,
    //   maxValue: 250,
    //   title: '輸出電壓',
    // })

    const g_batteryVoltage = this.createGauge({
      majorTicks: [45, 50, 55, 60],
      units: 'Voltage',
      value: 48,
      minValue: 45,
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

      // update powerGenerated
      if (pvInputPower) {
        let powerGenerated = Big(pvInputPower).div(3600).div(1000).toNumber()
        powerGenerated = Number.parseFloat(powerGenerated.toFixed(2))
        g_powerGeneratedToday.value += powerGenerated
      }

      document.querySelectorAll('.gauges canvas').forEach((_) => _.removeAttribute('style'))
    }

    socket.emit('initLiveChart', (_data) => {
      const data = _data[_data.length - 1]
      setupGauge(data)
    })

    socket.on('updateLiveChart', (data) => {
      setupGauge(data)
    })

    let powerGeneratedToday = Big(0)
    socket.on('setChartData', (data) => {
      // console.time('count pv power')
      const d1 = dayjs().startOf('date')
      data.forEach((_) => {
        const d2 = dayjs(_[0])
        const diff = d2.diff(d1)
        if (diff < 0) return
        const pvInput = Big(_[20]).div(12).div(1000)
        powerGeneratedToday = powerGeneratedToday.plus(pvInput)
      })

      // console.timeEnd('count pv power')
      powerGeneratedToday = Number.parseFloat(powerGeneratedToday.toFixed(2))
      // console.log('powerGeneratedToday', powerGeneratedToday)
      g_powerGeneratedToday.value = powerGeneratedToday
    })
  },
  data: () => ({

  }),
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
  display: flex;
  justify-content: space-between;
  text-align: center;
  flex-wrap: wrap;
  canvas {
    margin: 0 auto;
    max-width: 50%;
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
