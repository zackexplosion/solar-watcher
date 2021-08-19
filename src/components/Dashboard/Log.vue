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
      this.currentLog = data
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
    width: calc(100% - 900px);
    max-height: 150px;
    overflow: hidden;
    float: right;
  }
}
</style>
