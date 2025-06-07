<template>
  <div class="clock">
    <div class="date">{{ currentDate }}</div>
    <div class="time">{{ currentTime }}</div>
  </div>
</template>
<script>
import dayjs from 'dayjs'

export default {
  data: () => ({
    currentDate: null,
    currentTime: null,
    timer: null,
  }),
  props: {
    socket: {
      type: Object,
    },
  },
  mounted() {
    const { socket } = this.$store.state
    socket.on('updateLiveChart', () => {
      // const [timestamp] = data
      clearTimeout(this.clockTimeout)
      this.getTime()
    })

    this.getTime()
  },
  methods: {
    getTime() {
      const date = dayjs()
      this.currentDate = date.format('YYYY.MM.DD')
      this.currentTime = date.format('h:mm:ss A')

      this.clockTimeout = setTimeout(this.getTime, 1000)
    },
  },
}
</script>

<style lang="scss" scoped>
.clock {
  display: none;
}

@media  (min-width: 768px) {
  .clock {
    text-align: left;
    position: absolute;
    top:0;
    text-align: center;
    width: 100%;
    /* background: black; */
    /* position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%); */
    color: #CCC;
    // font-size: 34px;
    // /* font-family: 'Inconsolata', monospace; */
    font-weight: bold;
    letter-spacing: 7px;
    padding: 0.5em 0;
    display: block;
    padding: 0;
    // font-size: 60px;
    // float:left;
    .time,
    .date {
      display: inline-block;
      margin-right: 1em;
    }
  }
}
</style>
