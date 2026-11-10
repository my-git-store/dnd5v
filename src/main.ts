import './styles/index.css'
import './ui/styles/index.css'

import { createApp } from 'vue'

import App from './App.vue'
import { assetUrl } from './config/assets'
import naive from 'naive-ui'

document.documentElement.style.setProperty(
    '--sheet-map-background',
    `url("${assetUrl('/character-sheet-parchment.png')}")`,
)

const app = createApp(App)

app.use(naive).mount('#app')
