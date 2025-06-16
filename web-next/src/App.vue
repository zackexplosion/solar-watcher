<script setup lang="ts">
import Chart from './components/Chart.vue'
import { LineSeries, CandlestickSeries } from 'lightweight-charts'
const seriesKeys = [
  {
    label: 'pvInputVoltage',
    legendLabel: 'PV 輸入電壓',
    color: '#1d7fa2',
    type: LineSeries,
    paneIndex: 0
  },
  {
    label: 'acOutputActivePower',
    legendLabel: 'AC 輸出功率',
    color: '#da0808',
    type: CandlestickSeries,
    paneIndex: 0
  },
  {
    label: 'pvInputPower',
    legendLabel: 'PV 輸入功率',
    color: '#08da4a',
    type: CandlestickSeries,
    paneIndex: 0
  },
  {
    label: 'batteryVoltage',
    legendLabel: '電池電壓',
    color: '#ffeb00',
    type: CandlestickSeries,
    paneIndex: 1
  },
  {
    label: 'batteryCapacity',
    legendLabel: '電量百分比',
    color: '#620bed',
    type: LineSeries,
    paneIndex: 2
  },
  {
    label: 'batteryChargingCurrent',
    legendLabel: '電池充電電流',
    color: '#da0808',
    type: LineSeries,
    paneIndex: 2
  },
  {
    label: 'batteryDischargeCurrent',
    legendLabel: '電池放電電流',
    color: '#08da4a',
    type: LineSeries,
    paneIndex: 2
  },
]
</script>

<template>
  <Chart :series-keys="seriesKeys"/>
</template>

<style scoped>

</style>
