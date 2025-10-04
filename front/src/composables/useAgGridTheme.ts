// composables/useAgGridTheme.ts
import { computed, ref } from 'vue'
import { themeQuartz, colorSchemeDark, colorSchemeLight } from 'ag-grid-community'

import { useUXStore } from '@/stores/ux'
const ux = useUXStore()

export const useAgGridTheme = () => {
  const isDark = computed(() => (ux.isDark ? true : false))
  
  const baseThemeParams = computed(() => ({
    fontFamily: 'RobotoCondensed',
    backgroundColor: `var(--background)`,
    headerBackgroundColor: `var(--background)`,
    headerTextColor: `var(--muted-foreground)`,
    rowHoverColor: `var(--primary-foreground)`
  }))
  
  const currentTheme = computed(() => {
    const baseTheme = isDark.value 
      ? themeQuartz.withPart(colorSchemeDark)
      : themeQuartz.withPart(colorSchemeLight)
    
    return baseTheme.withParams(baseThemeParams.value)
  })

  return {
    currentTheme
  }
}