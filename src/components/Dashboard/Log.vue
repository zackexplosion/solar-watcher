<template>
  <div id="log">
    {{currentLog}}
  </div>
</template>
<script>
// import dayjs from 'dayjs'

export default {
  data: () => ({
    currentLog: null,
  }),
  mounted() {
    const { socket } = this.$store.state
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

      let powerSource = 'line'

      if (batteryDischargeCurrent > 0 || pvInputPower > acOutputActivePower) {
        powerSource = 'battery'
      }
      this.currentLog = {
        chargingCurrent: batteryChargingCurrent,
        dischargeCurrent: batteryDischargeCurrent,
        powerSource,
      }
    })
  },
  methods: {
  },
}
</script>

<style lang="scss" scoped>
#log {
  display: none;
}

@media  (min-width: 768px) {
  #log {
    display: block;
    color: #CCC;
    width: calc(100% - 950px);
    max-height: 150px;
    overflow: hidden;
    float: right;
  }
}
</style>
