import './styles/index.css'
import './ui/styles/index.css'

import { createApp } from 'vue'
import App from './App.vue'
import { assetUrl } from './config/assets'

document.documentElement.style.setProperty('--sheet-map-background', `url("${assetUrl('/Изображение ChatGPT 30 сент. 2026 г., 23_16_10.png')}")`)

createApp(App).mount('#app')
