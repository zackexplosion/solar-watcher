import Vue from 'vue';
import Vuex from 'vuex'
import { io } from 'socket.io-client'
import App from './App.vue';
// import './registerServiceWorker';

Vue.use(Vuex)

Vue.config.productionTip = false;

const store = new Vuex.Store({
  state: {
    count: 0,
    socket: io(),
  },
})

new Vue({
  render: (h) => h(App),
  store,
}).$mount('#app');
