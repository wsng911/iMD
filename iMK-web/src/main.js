import { createApp } from 'vue'
import './style.css'
import 'highlight.js/styles/github-dark.css'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')
