import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8000/api/ga'
axios.defaults.headers.common['Accept'] = 'application/json'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')


