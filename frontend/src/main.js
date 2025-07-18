import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './assets/base.css' // Import global base styles
import './assets/main.css' // Import global main styles

createApp(App).use(router).mount('#app')