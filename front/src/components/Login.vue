<script setup lang="ts">

// router
import { useRouter } from 'vue-router'
const router = useRouter()

// recaptcha
import { useRecaptcha } from '@/composables/useRecaptcha'
const { ready, loadScript, execute } = useRecaptcha(import.meta.env.VITE_RECAPTCHA_SITE_KEY)

onMounted(() => {
  loadScript().catch(() => {
    console.error('Failed to load reCAPTCHA')
  })
})

import { ref, reactive, type Ref } from 'vue'
// email
const emailSubmitted = ref(false)
const submitStatus:Ref<string | null> = ref(null)
const emailSent = ref(false)
const formData = reactive({
  email: ''
});

async function handleSubmit () {
  if (emailSubmitted.value) return
  emailSubmitted.value = true
  submitStatus.value = 'Sending Email Link...'
  try {
    const token = await execute('email_login')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recaptcha_token: token,
        recaptcha_action: 'email_login',
        to: formData.email
      })
    })

    submitStatus.value = response.status === 200 ? 'Check Email for Link' : 'Something went wrong'
    emailSent.value = true
  } catch (err) {
    emailSubmitted.value = false
  }
}

// google auth
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore, AUTH_MESSAGE_TYPES } from '@/stores/auth'
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337'
const googleRequested: Ref<boolean> = ref(false)
const authStore = useAuthStore()
const openGoogleAuth = () => {
  googleRequested.value = true
  const width = 500
  const height = 600
  const left = (window.screen.width - width) / 2
  const top = (window.screen.height - height) / 2
  window.open(
    `${backendUrl}/api/connect/google`,
    'googleAuth',
    `width=${width},height=${height},left=${left},top=${top},resizeable=yes,scrollbars=yes`
  )
}

const handleAuthMessage = async (event: MessageEvent) => {
  if (event.origin !== window.location.origin) return
  if (event.data.type === AUTH_MESSAGE_TYPES.SUCCESS) {
    await authStore.setAuth(event.data.data.jwt, event.data.data.user)
    router.push(authStore.intendedRoute?.fullPath ?? '/')
  } else if (event.data.type === AUTH_MESSAGE_TYPES.ERROR) {
    // didn't auth
  }
}

onMounted(() => {
  window.addEventListener('message', handleAuthMessage)
})

onUnmounted(() => {
  emailSubmitted.value = false

  const badge = document.querySelector('.grecaptcha-badge')
  if (badge && badge instanceof HTMLElement) {
    badge.style.visibility = 'hidden'
  }
  
  window.removeEventListener('message', handleAuthMessage)
})

// components
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui//card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from './ui/spinner'
</script>
<template>
<div class="w-full h-full flex justify-center items-center">
  <div class="flex flex-col gap-6">
    <Card class="border-border">
      <CardHeader class="text-center">
        <CardTitle class="text-xl tracking-[-0.0125rem] text-muted-foreground">
          Please log in
        </CardTitle>
        <CardDescription>
          To continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit">
          <div class="grid gap-6">
            <div class="flex flex-col gap-4">
              <span class="relative">
                <div v-if="googleRequested" @click="googleRequested = false" class="absolute inset-0 right-[var(--app-md-spacing)] flex items-center justify-end text-xs text-muted-foreground hover:text-primary">
                  <span class="hover:underline cursor-pointer">Try again?</span>
                </div>
                <Button @click="openGoogleAuth" type="button" variant="outline" :disabled="googleRequested" class="w-full cursor-pointer text-muted-foreground fill-muted-foreground hover:fill-primary!">
                  <svg v-if="!googleRequested" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="">
                    <path
                      
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                
                    />
                  </svg>
                  <Spinner v-if="googleRequested" />
                  <span v-if="!googleRequested">With gmail</span>
                  <span v-if="googleRequested">See Pop-up</span>

                </Button>
              </span>
            </div>
            <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span class="relative z-10 bg-background px-2 text-muted-foreground">
                or send a login link to
              </span>
            </div>
            <div class="grid gap-6 transition-opacity">
              <div class="grid gap-2 min-h-[3.6em] text-muted-foreground">
                <Label html-for="email">Email</Label>
                <Input
                  v-model="formData.email"
                  id="email"
                  type="email"
                  placeholder="me@example.com"
                  :disabled="!ready"
                  required
                />
              </div>
              <span class="relative">
                <div v-if="emailSubmitted && emailSent" @click="emailSubmitted = false; emailSent = false" class="absolute h-full right-[var(--app-md-spacing)] flex items-center justify-end text-xs text-muted-foreground hover:text-primary">
                  <span class="hover:underline cursor-pointer dark:text-background dark:z-1 dark:font-medium">Try again?</span>
                </div>
              <Button type="submit" :disabled="!ready || emailSubmitted" class="w-full bg-ring text-secondary cursor-pointer">
                <span v-if="!ready">reCaptcha...</span>
                <span v-else-if="emailSubmitted" class="flex items-center text-primary">
                  <Spinner v-if="!emailSent" class="mr-[var(--app-xs-spacing)]" />
                  {{ submitStatus }}
                </span>
                <span v-else>Send</span>
              </Button>
            </span>
            </div>
            <!-- <div class="text-center text-sm">
              Don't have an account?
              <a href="#" class="underline underline-offset-4">
                Sign up
              </a>
            </div> -->
          </div>
        </form>
      </CardContent>
    </Card>
    <div class="text-primary text-center text-xs [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
      By clicking continue, you agree to our
      
      <Popover>
        <PopoverTrigger as-child>
          <a class="cursor-pointer">Terms of Service</a>
        </PopoverTrigger>
        <PopoverContent class="w-auto text-xs text-center">
          I get your email, you get to keep a collection.
        </PopoverContent>
      </Popover>

      and

      <Popover>
        <PopoverTrigger as-child>
          <a class="cursor-pointer">Privacy Policy</a>
        </PopoverTrigger>
        <PopoverContent class="w-auto text-xs text-center">
          I will not share your email with anyone.
        </PopoverContent>
        </Popover>
      .

    </div>
  </div>
</div>
</template>
<style>
.grecaptcha-badge { display: none }
</style>
