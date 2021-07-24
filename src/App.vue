<template>
  <div id="app" v-show="ready">
    <Dashboard />
    <Chart @ready="onReady()" />
  </div>
</template>

<script>
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
