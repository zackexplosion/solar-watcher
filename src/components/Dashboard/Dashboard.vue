<template>
  <div id="dashboard">
    <div class="row">
      <Clock/>
      <Log />
    </div>
    <Gauges />
  </div>
</template>
<script>
import Gauges from './Gauges.vue'
import Clock from './Clock.vue'
import Log from './Log.vue'

export default {
  name: 'Dashboard',
  components: {
    Clock,
    Log,
    Gauges,
  },
}
</script>

<style scoped>
.row:after {
  content: "";
  display: table;
  clear:both;
}
</style>
