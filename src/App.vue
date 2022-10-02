<template>
  <div id="app" ref="app">
    <nav>
      <h1>Solar Watcher</h1>
      <Clock/>
      <Log />
    </nav>
    <Gauges />
    <Chart @ready="onReady()" />
  </div>
</template>

<script>
import Log from './components/Log.vue'
import Chart from './components/Chart.vue'
import Gauges from './components/Gauges.vue'
import Clock from './components/Clock.vue'

export default {
  name: 'App',
  components: {
    Log,
    Gauges,
    Clock,
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
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  text-align: left;
  margin: 0 auto;
  width: 100%;
  // height: 100%;
  // padding:0.5em 15px 0 15px;
  // overflow: hidden;
}
// .chart {
//   height: calc(100vh - 450px) ;
// }

nav {
  padding:0 1em;
  margin-top: 1em;
  position: relative;
  height: 40px;
  h1 {
    background: url('/img/icons/apple-touch-icon-60x60.png') no-repeat left center;
    display: inline-block;
    background-size: contain;
    padding-left: 50px;
    margin:0;
    color: #FFFFFF;
  }
}

</style>
