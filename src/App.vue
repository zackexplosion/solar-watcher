<template>
  <div id="app">
    <div v-if="!ready">
      <Loading />
    </div>
    <div v-show="ready" style="height:70%">
      <Dashboard />
      <Chart @ready="ready = true" />
    </div>
  </div>
</template>

<script>
import Chart from './components/Chart.vue'
import Loading from './components/Loading.vue'
import Dashboard from './components/Dashboard/Dashboard.vue'

export default {
  name: 'App',
  components: {
    Dashboard,
    Chart,
    Loading,
  },
  mounted() {
    // this.setupSocket()
    // this.$store.socket = io()
  },
  data: () => ({
    // socket: io(),
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
  padding: 1em;
  // margin-top: 40px;
  height: 100vh;
  overflow: hidden;
}
h1 {
  text-align: center;
}

</style>
