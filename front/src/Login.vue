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
// email
import { ref, reactive } from 'vue'
const submitting = ref(false)
const formData = reactive({
  email: ''
});

async function handleSubmit () {
  if (submitting.value) return
  submitting.value = true
  try {
    const token = await execute('email_login')
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recaptcha_token: token,
        recaptcha_action: 'email_login',
        to: formData.email
      }),
    })
  } finally {
    submitting.value = false
  }
}

// google auth
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore, AUTH_MESSAGE_TYPES } from '@/stores/auth'
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1337'
const authStore = useAuthStore()
const openGoogleAuth = () => {
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
  submitting.value = false

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
</script>
<template>
<div class="w-full h-full flex justify-center items-center border-accent border-1">
  <div class="flex flex-col gap-6">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
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
              <Button @click="openGoogleAuth" type="button" variant="outline" class="w-full cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                With gmail
              </Button>
            </div>
            <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span class="relative z-10 bg-background px-2 text-muted-foreground">
                or send a login link to
              </span>
            </div>
            <div class="grid gap-6">
              <div class="grid gap-2">
                <Label html-for="email">Email</Label>
                <Input
                  v-model="formData.email"
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  :disabled="!ready"
                  required
                />
              </div>
              <Button type="submit" :disabled="!ready || submitting" class="w-full">
                <span v-if="!ready">reCaptcha...</span>
                <span v-else-if="submitting">Sending...</span>
                <span v-else>Send</span>
              </Button>
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
    <div class="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
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
