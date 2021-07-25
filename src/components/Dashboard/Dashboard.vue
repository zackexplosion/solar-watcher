<template>
  <div>
    <Clock/>
    <div class="gauges" ref="gauges" />
  </div>
</template>
<script>
import { RadialGauge } from 'canvas-gauges'
import Clock from './Clock.vue'

export default {
  name: 'Dashboard',
  components: {
    Clock,
  },
  props: {
    socket: {
      type: Object,
    },
  },
  mounted() {
    // const radial = new RadialGauge({
    //   renderTo: document.createElement('canvas'),
    // })
    const { socket } = this.$store.state

    const g_pvInputPower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500, 3000],
      units: 'Watt',
      value: 0,
      minValue: 0,
      maxValue: 3000,
      title: '發電量',
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

    const gauges = [
      'gridVoltage',
      'acOutputActivePower',
      'acOutputVoltage',
      'pvInputPower',
      'batteryVoltage',
    ]

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
    }

    socket.emit('initLiveChart', (_data) => {
      const data = _data[_data.length - 1]
      setupGauge(data)
    })

    socket.on('updateLiveChart', (data) => {
      setupGauge(data)
    })
  },
  data: () => ({

  }),
  methods: {
    createGauge(options = {}) {
      const gauge = new RadialGauge({
        renderTo: document.createElement('canvas'),
        fontValue: '',
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
        needle: false,
        width: 150,
        height: 150,
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
  }
}

@media  (min-width: 768px) {
  .gauges {
    flex-wrap: wrap;
  }
  .gauges canvas{
    // flex-grow: 1;
  }
}
</style>
