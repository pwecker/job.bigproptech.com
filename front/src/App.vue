<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.initAuth()
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
