<template>
  <div id="log">
    {{currentLog}}
  </div>
</template>
<script>
// import dayjs from 'dayjs'
import logHandler from '../../common/log-handler'

export default {
  data: () => ({
    currentLog: null,
  }),
  mounted() {
    const { socket } = this.$store.state
    socket.on('updateLiveChart', (data) => {
      const log = logHandler(data)

      this.currentLog = {
        pvInputCurrent: log.pvInputCurrent,
        powerSource: log.powerSource,
      }

      // this.currentLog = log
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
    text-align: right;
    display: block;
    color: #CCC;
    // width: calc(100% - 1050px);
    width: 30%;
    max-height: 150px;
    overflow: hidden;
    position: absolute;
    right:15px;
    top: 0;
    // float: right;
  }
}
</style>
