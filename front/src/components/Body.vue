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
  const parent = target.parentNode as HTMLElement
  if (parent && parent.getAttribute('data-name') === 'mainScroll') {
    offset.value = target.scrollTop
    const maxScroll = target.scrollHeight - target.clientHeight
    bottomed.value = target.scrollTop >= maxScroll - 1
  }
}

// user flow
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { fullTeased, isAuthenticated } = storeToRefs(authStore)
const forceLogin = computed(() => {
  // todo: && !forceLoginPrompt
  return fullTeased.value && !isAuthenticated.value
})

// site flow
import { nextTick } from 'vue'
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { bottomed, drawerOpen, sidebarOpen } = storeToRefs(uxStore)
import { onMounted } from 'vue'
function updateBottomed() {
  if ((route.name === 'grid' && isAuthenticated.value) || !route.meta.showHero) {
    bottomed.value = true
  } else {
    bottomed.value = false
  }
}

onMounted(async () => {
  await nextTick()
  updateBottomed()
})

// also react when route or auth changes
watch([() => route.name, () => isAuthenticated.value], updateBottomed, {
  immediate: true,
})

// onboarding
import OnboardingTooltip from '@/components/OnboardingTooltip.vue'
import OnboardingProvider from '@/components/OnboardingProvider.vue'
import type { OnboardingStep } from '@/composables/useOnboarding'
const onboardingSteps: OnboardingStep[] = [
  {
    id: 'grid',
    title: 'Yes/No UI',
    content: 'Clicking items opens up a detailed view in order to swipe left/right.'
  },
  {
    id: 'sidebar',
    title: 'Liked items',
    content: 'Items are stored categorized in the sidebar.'
  },
  {
    id: 'tags',
    title: 'Tags',
    content: 'All available item meta tags.'
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

import { useRouter } from 'vue-router'
const router = useRouter()
const handleBgClick = (): void => {
  router.push('/')
}

// components
import { Button } from '@/components/ui/button'
import { Tags } from 'lucide-vue-next'
import Login from '@/components/Login.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
import Sidebar from '@/components/Sidebar.vue'
import { SidebarTrigger } from '@/components/ui/sidebar'
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
  data-name="mainScroll"
>

  <!-- hero -->
  <router-view v-if="route.meta.showHero && !bottomed" name="hero" :offset="offset" class="shrink-0 z-0"/>

  <!-- body -->
  <div class="relative flex-1 z-0 bg-background">
    <OnboardingProvider :steps="onboardingSteps" :auto-start="false">
      <SidebarProvider :key="isAuthenticated + ''" class="h-full w-full select-none">
        <Sidebar>
          <header class="px-[var(--app-sm-spacing)] h-[var(--app-header-height)] flex items-center justify-between z-0">
            <OnboardingTooltip step-id="sidebar">
              <!-- todo: posb race condition in :class -->
              <SidebarTrigger :class="{ 'bg-secondary': sidebarOpen, 'pointer-events-none text-muted-foreground!': !bottomed }" variant="ghost" class="scale-90 cursor-pointer p-4.5 text-primary"/>
            </OnboardingTooltip>
            <OnboardingTooltip step-id="tags">
              <Button
                class="cursor-pointer text-primary scale-90"
                :class="[drawerOpen ? 'bg-secondary' : 'bg-background']"
                variant="ghost"
                size="icon"
                @click="uxStore.toggleDrawer()"
              >
                <Tags />
              </Button>
            </OnboardingTooltip>
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
              <component  :is="Component" @backgroundClick="handleBgClick" />
            </div>
          </router-view>
        </Sidebar>
      </SidebarProvider>
    </OnboardingProvider>
  </div>

  <!-- popup login -->
  <Transition name="fade" mode="out-in">
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
  transition: opacity 0.3s ease 0s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* fade + grow */
.fade-grow-enter-active,
.fade-grow-leave-active {
  transition: opacity 0.1s ease 0.2s, transform 0.1s ease 0.2s;
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