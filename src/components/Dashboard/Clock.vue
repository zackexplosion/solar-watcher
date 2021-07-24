<template>
  <div class="clock">
  {{ theTime }}
  </div>
</template>
<script>
export default {
  data: () => ({
    theTime: null,
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
      this.getTime()
    })
    this.getTime()
  },
  methods: {
    getTime() {
      const date = new Date();
      let h = date.getHours(); // 0 - 23
      let m = date.getMinutes(); // 0 - 59
      let s = date.getSeconds(); // 0 - 59
      let session = 'AM';

      if (h === 0) {
        h = 12;
      }

      if (h > 12) {
        h -= 12;
        session = 'PM';
      }

      h = (h < 10) ? `0${h}` : h;
      m = (m < 10) ? `0${m}` : m;
      s = (s < 10) ? `0${s}` : s;

      // const time = `${h}:${m}:${s} ${session}`;
      const time = `${h}:${m}`;
      this.theTime = time

      // setTimeout(this.getTime, 1000);
    },
  },
}
</script>

<style scoped>
.clock {
  text-align: center;
  /* background: black; */
  /* position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%); */
  color: #CCC;
  font-size: 60px;
  font-family: Orbitron;
  letter-spacing: 7px;
}
</style>
