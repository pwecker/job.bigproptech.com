import { type Ref, ref, computed } from 'vue'
import { type CategoryBadge } from '@/composables/useTagApi'

export type UXStore = {
  // dark mode
  isDark: Ref<boolean>
  toggleDark: () => void
  setDark: (value: boolean) => void

  // fonts
  waitForFonts: (timeoutMs?: number) => Promise<void>
  fontsReady: Ref<boolean>

  // site flow
  bottomed: Ref<boolean>

  // preferences
  categories: Ref<Record<string, Record<string, boolean>>>
  toggleCategory: (badge: CategoryBadge) => void
  isActiveCategory: (badge: CategoryBadge) => boolean

  // drawer
  toggleDrawer: () => void
  drawerOpen: Ref<boolean>

  // sidebar
  sidebarOpen: Ref<boolean>
}

import { defineStore, storeToRefs } from 'pinia'

// dark mode
import { useDark, useToggle } from '@vueuse/core'
const isDark = useDark()
const toggleDark = useToggle(isDark)

// site
const bottomed = ref<boolean>(false)

// preferences
const categories = ref<Record<string, Record<string, boolean>>>({})
const activeBadges = computed(() =>
  new Set(
    Object.entries(categories.value).flatMap(([cat, values]) =>
      Object.keys(values).map(v => `${cat}:${v}`)
    )
  )
)

//fonts
const fontsReady = ref(false)
async function waitForFonts(timeoutMs = 690) {
  if (!('fonts' in document)) {
    fontsReady.value = true
    return
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Font load timeout')), timeoutMs)
      }),
    ])
  } catch {} finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    fontsReady.value = true
  }
}

// sidebar, drawer
import { useAuthStore } from '@/stores/auth'

export const useUXStore = defineStore('ux', (): UXStore => {
  const authStore = useAuthStore()
  const { isAuthenticated } = storeToRefs(authStore)
  const drawerOpen: Ref<boolean> = ref(false)
  const sidebarOpen: Ref<boolean> = ref(isAuthenticated.value)

  function setDark(value: boolean) {
    isDark.value = value
  }

  function toggleCategory (badge: CategoryBadge) {
    const { category, value } = badge
    if (!categories.value[category]) {
      categories.value[category] = {}
    }
  
    if (categories.value[category][value]) {
      delete categories.value[category][value]
      if (Object.keys(categories.value[category]).length === 0) {
        delete categories.value[category]
      }
    } else {
      categories.value[category][value] = true
    }
  }

  function isActiveCategory(badge: CategoryBadge) {
    return activeBadges.value.has(`${badge.category}:${badge.value}`)
  }

  function toggleDrawer() {
    drawerOpen.value = !drawerOpen.value
  }

  return { isDark, setDark, toggleDark, waitForFonts, fontsReady, categories, toggleCategory, isActiveCategory, bottomed, toggleDrawer, drawerOpen, sidebarOpen }
})