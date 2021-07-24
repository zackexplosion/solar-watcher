<template>
  <div id="app">
    <div v-show="ready">
      <Dashboard
        :socket="socket"
      />
      <Chart
        :socket="socket"
        @ready="onReady()"
      />
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import Chart from './components/Chart.vue'
// import Loading from './components/Loading.vue'
import Dashboard from './components/Dashboard/Dashboard.vue'

export default {
  name: 'App',
  components: {
    Dashboard,
    Chart,
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
    onReady() {
      document.querySelector('.loading-container').remove()
      this.ready = true
    },
    // setupSocket() {
    //   const socket = io()
    // },
  },
};
</script>

<style lang="scss">
#app {
  text-align: left;
  width: 100%;
  margin: 0 auto;
  padding: 1em;
  // margin-top: 40px;
  height: 100vh;
  overflow: hidden;
}
h1 {
  text-align: center;
}

</style>
