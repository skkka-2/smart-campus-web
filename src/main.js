import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/router';

import 'element-plus/dist/index.css';
import 'boxicons/css/boxicons.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles/index.css';

const app = createApp(App);
const pinia = createPinia();

// pinia 必须先 use,router guard 里可能读 store
app.use(pinia).use(router).mount('#app');
