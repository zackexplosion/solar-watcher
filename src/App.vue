<template>
  <div id="app">
    <div v-if="!ready">
      <Loading />
    </div>
    <Chart
      v-show="ready"
      :socket="socket"
      @ready="ready = true"
    />
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import Chart from './components/Chart.vue'
import Loading from './components/Loading.vue'

export default {
  name: 'App',
  components: {
    Chart,
    Loading,
  },
  mounted() {
    // this.setupSocket()
  },
  data: () => ({
    socket: io(),
    ready: false,
    msgFromServer: '',
  }),
  methods: {
    // setupSocket() {
    //   const socket = io()
    // },
  },
};
</script>

<style lang="scss">
body {
  padding:0;
  margin:0;
  background: #000000;
}
#app {
  text-align: left;
  width: 100%;
  margin: 0 auto;
  // margin-top: 40px;
  height: 100vh;
  overflow: hidden;
}
h1 {
  text-align: center;
}

</style>
