import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './style.css'
import './app.css'

const app = createApp(App)
const pinia = createPinia()

// openreplay
import Tracker from '@openreplay/tracker'
import { createOpenreplayPiniaPlugin } from '@/plugins/openreplayPinia'
const openreplayEnabled = import.meta.env['VITE_OPENREPLAY_ENABLED'] === 'true'
const projectKey = import.meta.env['VITE_OPENREPLAY_PROJECT']
const __DISABLE_SECURE_MODE = import.meta.env['VITE_OPENREPLAY_DISABLE_SECURE'] === 'true'
if (projectKey && openreplayEnabled) {
  const tracker = new Tracker({ projectKey, __DISABLE_SECURE_MODE})
  tracker.start()
  pinia.use(createOpenreplayPiniaPlugin(tracker))
}

app.use(pinia)
app.use(router)

app.mount('#app')
