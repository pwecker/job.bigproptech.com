import { type Ref, ref, computed } from 'vue'
import { type CategoryBadge } from '@/composables/useTagApi'

export type UXStore = {
  // dark mode
  isDark: Ref<boolean>
  toggleDark: () => void
  setDark: (value: boolean) => void

  // preferences
  categories: Ref<Record<string, Record<string, boolean>>>
  toggleCategory: (badge: CategoryBadge) => void
  isActiveCategory: (badge: CategoryBadge) => boolean
}

import { defineStore } from 'pinia'

// dark mode
import { useDark, useToggle } from '@vueuse/core'
const isDark = useDark()
const toggleDark = useToggle(isDark)

// preferences
const categories = ref<Record<string, Record<string, boolean>>>({})
const activeBadges = computed(() =>
  new Set(
    Object.entries(categories.value).flatMap(([cat, values]) =>
      Object.keys(values).map(v => `${cat}:${v}`)
    )
  )
)

export const useUXStore = defineStore('ux', (): UXStore => {
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

  return { isDark, setDark, toggleDark, categories, toggleCategory, isActiveCategory }
})