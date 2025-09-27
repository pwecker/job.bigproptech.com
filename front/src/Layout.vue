<script setup lang="ts">

// route guard
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const route = useRoute()
const authStore = useAuthStore()
const { isTeased, isAuthenticated } = storeToRefs(authStore)

// components
import Login from '@/Login.vue'
import Sidebar from '@/Sidebar.vue'
import Settings from '@/Settings.vue'
// import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { 
  SidebarTrigger,
} from '@/components/ui/sidebar'
</script>
<template>

  <Sidebar>
    <header class="border-b-1 p-3 h-[var(--app-header-height)] flex items-center justify-between z-0">
      <SidebarTrigger variant="outline" class="p-4.5 p-4.5 dark:text-stone-300 text-stone-950"/>
      <Settings/>
    </header>

    <!-- main -->
    <!-- <ScrollArea class="scroll-area z-0 h-[calc(100%-var(--app-header-height))] relative"> -->
      <router-view/>
      <!-- <ScrollBar orientation="horizontal" />
    </ScrollArea> -->

    <!-- overlay content -->
    <Transition name="fade" mode="out-in">
      <div v-if="route.name === 'carousel'" class="absolute inset-0 z-9 bg-black/10 backdrop-blur-[1px]"></div>
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

  <!-- popup login -->
  <Transition name="fade" mode="out-in">
    <div v-if="isTeased && !isAuthenticated"
      class="absolute inset-0 z-19 bg-black/50 backdrop-blur-sm"
    ></div>
  </Transition>
  <Transition name="fade-grow" mode="out-in">
    <div
      v-if="isTeased && !isAuthenticated"
      class="absolute inset-0 z-20"
    ><Login /></div>
  </Transition>

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

</style>