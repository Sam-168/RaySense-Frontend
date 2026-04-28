// src/main.js
import { createApp }  from 'vue'
import { createPinia } from 'pinia'
import App    from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())  // Must be before router
app.use(router)

app.mount('#app')