<script setup lang="ts">

import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

import { useAuthStore, AUTH_MESSAGE_TYPES } from '@/stores/auth'
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337'
const authStore = useAuthStore()

const handleGoogleCallback = async () => {
  const { access_token, id_token } = route.query

  if (!access_token || !id_token) {
    if (window.opener) {
      window.opener.postMessage({ type: AUTH_MESSAGE_TYPES.ERROR }, window.location.origin)
      window.close()
    } else {
      if (isMounted.value) router.push('/login')
    }
    return
  }

  try {
    const queryString = new URLSearchParams(route.query as Record<string, string>).toString()
    const response = await fetch(`${backendUrl}/api/auth/google/callback?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Auth failed')
    }

    const data = await response.json()

    if (!isMounted.value) return

    authStore.setAuth(data.jwt, data.user)

    if (window.opener) {
      window.opener.postMessage({
        type: AUTH_MESSAGE_TYPES.SUCCESS,
        data: {
          jwt: data.jwt,
          user: data.user
        }
      }, window.location.origin)
      window.close()
    } else {}
  } catch (err) {
    if (window.opener) {
      window.opener.postMessae({ type: AUTH_MESSAGE_TYPES.ERROR }, window.location.origin)
      window.close()
    } else {
      if (isMounted.value) router.push('/login')
    }
  }
}

import { onMounted, onUnmounted, ref } from 'vue'
const isMounted = ref(true)
onMounted(() => {
  handleGoogleCallback()
})
onUnmounted(() => {
  isMounted.value = false
})
</script>
<template></template>