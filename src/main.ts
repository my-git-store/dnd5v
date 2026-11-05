import './styles/index.css'
import './ui/styles/index.css'

import { createApp } from 'vue'
import App from './App.vue'
import { assetUrl } from './config/assets'

document.documentElement.style.setProperty('--sheet-map-background', `url("${assetUrl('/character-sheet-parchment.png')}")`)

createApp(App).mount('#app')
