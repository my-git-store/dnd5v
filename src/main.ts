import './styles/index.css'

import { createApp } from 'vue'

import App from './App.vue'
import naive from 'naive-ui'

const parchmentUrl = new URL(
    `${import.meta.env.BASE_URL}character-sheet-parchment.png`,
    window.location.origin,
).toString()

document.documentElement.style.setProperty('--sheet-map-background', `url("${parchmentUrl}")`)

const app = createApp(App)

app.use(naive).mount('#app')
