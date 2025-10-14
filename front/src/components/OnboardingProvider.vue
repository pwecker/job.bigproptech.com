<script setup lang="ts">
import { onMounted } from 'vue'
import { provideOnboarding, type OnboardingStep } from '@/composables/useOnboarding'

const props = defineProps<{
  steps: OnboardingStep[]
  autoStart?: boolean
}>()

const onboarding = provideOnboarding(props.steps)

onMounted(() => {
  const onboarded = localStorage.getItem('onboarding-completed')
  if (props.autoStart && !onboarded) {
    setTimeout(() => onboarding.start(), 500)
  } else if (onboarded) {
    onboarding.complete()
  }
})

import { useRoute } from 'vue-router'
const route = useRoute()
import { watch } from 'vue'
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
watch(() => uxStore.bottomed, (newValue) => {
  if (newValue && route.name === 'grid' && !props.autoStart && !localStorage.getItem('onboarding-completed')) {
    setTimeout(() => onboarding.start(), 100)
  }
})

defineExpose({ onboarding })
</script>
<template>
  <slot />
</template>