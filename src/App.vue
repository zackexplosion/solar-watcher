<template>
  <div id="app" ref="app">
    <!-- need app width before ready -->
    <Dashboard />
    <Chart @ready="onReady()" />
  </div>
</template>

<script>
import Chart from './components/Chart2.vue'
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
    // this.$store.socket = io()
  },
  data: () => ({
    // socket: io(),
    ready: false,
    msgFromServer: '',
  }),
  methods: {
    onReady() {
      const loader = document.querySelector('.loading-container')
      if (loader) loader.remove()

      this.ready = true
    },
  },
};
</script>

<style lang="scss">
html, body {
  margin:0;
  padding:0;
}

body{
  padding: 0 1em;
}

#app {
  text-align: left;
  margin: 0 auto;
  width: 100%;
  // height: 100%;
  padding-top: 0.5em;
  // overflow: hidden;
}
// .chart {
//   height: calc(100vh - 450px) ;
// }

</style>
