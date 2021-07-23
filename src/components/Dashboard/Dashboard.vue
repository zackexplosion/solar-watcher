<template>
  <div>
    <Clock />
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

    // const g_gridVoltage = this.createGauge({
    //   majorTicks: [200, 210, 220, 230, 240, 250],
    //   units: 'Voltage',
    //   value: 220,
    //   minValue: 200,
    //   maxValue: 250,
    //   title: '市電電壓',
    // })

    const g_acOutputActivePower = this.createGauge({
      majorTicks: [500, 1000, 1500, 2000, 2500],
      units: 'Watt',
      value: 800,
      minValue: 500,
      maxValue: 2000,
      title: 'AC負載',
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
      // g_gridVoltage.value = gridVoltage
      g_acOutputActivePower.value = acOutputActivePower
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
        width: 160,
        height: 160,
        // borderRadius: 20,
        // borders: 0,
        // barStrokeWidth: 20,
        minorTicks: 2,
        colorValueBoxShadow: false,
        strokeTicks: true,
        highlights: [
          // {
          //   from: -50,
          //   to: 0,
          //   color: 'rgba(0,0, 255, .3)',
          // },
          // {
          //   from: 0,
          //   to: 50,
          //   color: 'rgba(255, 0, 0, .3)',
          // },
        ],
        ticksAngle: 225,
        startAngle: 67.5,
        colorMajorTicks: '#ddd',
        colorMinorTicks: '#ddd',
        colorTitle: '#eee',
        colorUnits: '#ccc',
        colorNumbers: '#eee',
        colorPlate: '#222',
        borderShadowWidth: 0,
        borders: true,
        needleType: 'arrow',
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: 'linear',
        colorBorderOuter: '#333',
        colorBorderOuterEnd: '#111',
        colorBorderMiddle: '#222',
        colorBorderMiddleEnd: '#111',
        colorBorderInner: '#111',
        colorBorderInnerEnd: '#333',
        colorNeedleShadowDown: '#333',
        colorNeedleCircleOuter: '#333',
        colorNeedleCircleOuterEnd: '#111',
        colorNeedleCircleInner: '#111',
        colorNeedleCircleInnerEnd: '#222',
        valueBoxBorderRadius: 0,
        colorValueBoxRect: '#222',
        colorValueBoxRectEnd: '#333',
        // majorTicks: [200, 210, 220, 230, 240, 250],
        // units: 'Voltage',
        // value: 220,
        // minValue: 200,
        // maxValue: 250,
        // title: '電壓',
        ...options,
      }).draw()
      this.$refs.gauges.appendChild(gauge.options.renderTo)

      return gauge
    },
  },
};
</script>
