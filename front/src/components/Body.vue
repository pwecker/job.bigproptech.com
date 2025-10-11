<script setup lang="ts">

// route guard
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const route = useRoute()
const authStore = useAuthStore()
const { fullTeased, isAuthenticated } = storeToRefs(authStore)

// components
import Login from '@/components/Login.vue'
import Sidebar from '@/components/Sidebar.vue'
import Tags from '@/components/Tags.vue'
import { 
  SidebarTrigger,
} from '@/components/ui/sidebar'
</script>
<template>

  <Sidebar class="">
    <header class="px-1 pr-2 h-[var(--app-header-height)] flex items-center justify-between z-0">
      <SidebarTrigger variant="ghost" class="scale-90 cursor-pointer p-4.5 text-primary"/>
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

  <!-- popup login -->
  <Transition name="fade" mode="out-in">
    <div v-if="fullTeased && !isAuthenticated"
      class="absolute inset-0 z-19 bg-black/50 backdrop-blur-sm"
    ></div>
  </Transition>
  <Transition name="fade-grow" mode="out-in">
    <div
      v-if="fullTeased && !isAuthenticated"
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