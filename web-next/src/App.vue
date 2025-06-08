<script setup lang="ts">
import Chart from './components/Chart.vue'
import { onMounted } from 'vue'
const powerChartSeriesKeys = [
{
    label: 'acOutputActivePower',
    color: '#da0808'
  },
  {
    label: 'pvInputPower',
    color: '#08da4a'
  },
]

const batteryChartSeriesKeys =[
  {
    label: 'batteryVoltage',
    color: '#ffeb00'
  },
]

onMounted(() => {

})
</script>

<template>
  <!-- <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" /> -->
  <Chart :series-keys="powerChartSeriesKeys"/>
  <Chart :series-keys="batteryChartSeriesKeys"/>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
