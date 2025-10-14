<script setup lang="ts">

// route guard
import { useRoute } from 'vue-router'

import { computed } from 'vue'
const route = useRoute()

// scroll
import { ref } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
const offset = ref<number>(0)
const handleScrollCapture = (event: UIEvent) => {
  const target = event.target as HTMLElement
  if(target.getAttribute('data-slot') === 'scroll-area-viewport') {
    offset.value = target.scrollTop
    const maxScroll = target.scrollHeight - target.clientHeight
    bottomed.value = target.scrollTop >= maxScroll - 1
  }
}

// site flow
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { bottomed } = storeToRefs(uxStore)
import { onMounted } from 'vue'
onMounted(() => {
  if ((route.name === 'grid' && isAuthenticated.value) || !route.meta.showHero) {
    bottomed.value = true
  }
})

// user flow
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { fullTeased, isAuthenticated } = storeToRefs(authStore)
const forceLogin = computed(() => {
  return fullTeased.value && !isAuthenticated.value
})

// onboarding
import OnboardingTooltip from '@/components/OnboardingTooltip.vue'
import OnboardingProvider from '@/components/OnboardingProvider.vue'
import type { OnboardingStep } from '@/composables/useOnboarding'
const onboardingSteps: OnboardingStep[] = [
  {
    id: 'grid',
    title: 'Yes/No UI',
    content: 'Click them to swipe through'
  },
  {
    id: 'sidebar',
    title: 'Liked items',
    content: 'They save to the sidebar'
  },
  {
    id: 'tags',
    title: 'Tags',
    content: 'View all tags'
  }
]

// force reflow for ios safari etc.
import { watch } from 'vue'
watch(bottomed, (newVal) => {
  if (!newVal) return

  requestAnimationFrame(() => {
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    if (!viewport) return

    viewport.style.overflowY = 'hidden'
    void viewport.offsetHeight
    viewport.style.overflowY = 'auto'
  })
})

// components
import Login from '@/components/Login.vue'
import Sidebar from '@/components/Sidebar.vue'
import Tags from '@/components/Tags.vue'
import { 
  SidebarTrigger,
} from '@/components/ui/sidebar'
</script>
<template>
<!-- todo: add authed transition -->
<ScrollArea
  :class="[
    'h-dvh',
    { 'hide-thumb': bottomed },
    { 'overflow-hidden': forceLogin }
  ]"
  @scrollCapture="handleScrollCapture"
>

  <!-- hero -->
  <router-view v-if="route.meta.showHero && !bottomed" name="hero" :offset="offset" class="shrink-0 z-0"/>

  <!-- body -->
  <div class="relative flex-1 z-0 bg-background">
    <OnboardingProvider :steps="onboardingSteps" :auto-start="false">
      <Sidebar>
        <header class="px-1 pr-2 h-[var(--app-header-height)] flex items-center justify-between z-0">
          <OnboardingTooltip step-id="sidebar">
            <SidebarTrigger :class="{ 'pointer-events-none text-muted-foreground!': !bottomed }" variant="ghost" class="scale-90 cursor-pointer p-4.5 text-primary"/>
          </OnboardingTooltip>
          <Tags/>
        </header>

        <router-view/>

        <!-- overlay content -->
        <Transition name="fade" mode="out-in">
          <div v-if="route.name === 'stack'" class="absolute inset-0 z-9 bg-black/10 backdrop-blur-[1px]"></div>
        </Transition>

        <router-view
          v-slot="{ Component }"
          name="overlay"
        >
          <div v-if="Component" class="absolute inset-0 z-10">
            <component  :is="Component" @backgroundClick="$router.push('/')" />
          </div>
        </router-view>
      </Sidebar>
    </OnboardingProvider>
  </div>

  <!-- popup login -->
  <Transition name="fade" mode="out-in">
    <!-- todo: background edge shows while growing -->
    <div v-if="forceLogin && !isAuthenticated"
      class="fixed inset-0 z-19 bg-black/50 backdrop-blur-sm"
    ></div>
  </Transition>
  <Transition name="fade-grow" mode="out-in">
    <div
      v-if="forceLogin && !isAuthenticated"
      class="fixed inset-0 z-20"
    ><Login /></div>
  </Transition>
</ScrollArea>
</template>

<style scoped>
/* just fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* fade + grow */
.fade-grow-enter-active,
.fade-grow-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-grow-enter-from,
.fade-grow-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* body scroll bar */
:deep([data-slot="scroll-area-thumb"]) {
  opacity: 0 !important;
  transition: opacity 0.3s ease;
}
</style>