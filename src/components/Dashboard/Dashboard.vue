<template>
  <div id="dashboard">
    <Clock/>
    <Gauges />
  </div>
</template>
<script>
import Gauges from './Gauges.vue'
import Clock from './Clock.vue'

export default {
  name: 'Dashboard',
  components: {
    Gauges,
    Clock,
  },
}
</script>
