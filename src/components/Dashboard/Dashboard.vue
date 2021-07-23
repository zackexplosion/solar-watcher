<template>
  <div>
    <Clock :socket="socket"/>
    <div ref="gauges" />
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
    const { socket } = this

    const g_gridVoltage = this.createGauge({
      majorTicks: [200, 210, 220, 230, 240, 250],
      units: 'Voltage',
      value: 220,
      minValue: 200,
      maxValue: 250,
      title: '市電電壓',
    })

    const g_acOutputActivePower = this.createGauge({
      majorTicks: [500, 1000, 1500, 2000, 2500],
      units: 'Watt',
      value: 0,
      minValue: 500,
      maxValue: 2000,
      title: 'AC負載',
    })

    const g_pvInputPower = this.createGauge({
      majorTicks: [0, 500, 1000, 1500, 2000, 2500],
      units: 'Watt',
      value: 0,
      minValue: 0,
      maxValue: 2500,
      title: '發電量',
    })

    socket.on('updateLiveChart', (data) => {
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
      g_gridVoltage.value = gridVoltage
      g_acOutputActivePower.value = acOutputActivePower
      g_pvInputPower.value = pvInputPower
      // g_gridVoltage.update()
      // g_acOutputActivePower.update()
    })
  },
  data: () => ({

  }),
  methods: {
    createGauge(options = {}) {
      const gauge = new RadialGauge({
        renderTo: document.createElement('canvas'),
        barWidth: 20,
        barShadow: 1,
        colorBarProgress: 'rgba(200,50,50,.75)',
        colorBar: '#eaa',
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
        needle: false,
        width: 160,
        height: 160,
        ...options,
      }).draw()
      this.$refs.gauges.appendChild(gauge.options.renderTo)

      return gauge
    },
  },
};
</script>
