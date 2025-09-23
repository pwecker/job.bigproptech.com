<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initAuth()

// font guard
import { onMounted } from 'vue'
import { useUXStore } from '@/stores/ux'
const ux = useUXStore()
onMounted(() => {
  ux.waitForFonts()
})
</script>

<template>
  <!-- font guard -->
  <div v-if="!ux.fontsReady" class="invisible absolute -z-1 font-robotoCondensed">.</div>
  <!-- app -->
  <RouterView v-if="ux.fontsReady" />
</template>

<style scoped></style>
