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

// gtag
import { configure, event } from 'vue-gtag'
const gtagEnabled = import.meta.env['VITE_GTAG_ENABLED'] === 'true'
const gtagId = import.meta.env['VITE_GTAG_ID'] || 'G-XXXXXXX'
if (gtagEnabled) {
  configure({
    tagId: gtagId,
    config: {
      send_page_view: false
    }
  })

  router.afterEach((to, from) => {
    if (to.name !== 'grid' || !from.name) {
      event('page_impression', {
        page_path: to.fullPath
      })
    }
  })
}

app.use(pinia)
app.use(router)

app.mount('#app')
