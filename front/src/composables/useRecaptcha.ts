import { ref } from 'vue'

declare global {
  interface Window {
    grecaptcha?: any
  }
}

export function useRecaptcha(siteKey: string) {
  const ready = ref(false)
  let scriptPromise: Promise<void> | null = null

  function loadScript() {
    if (ready.value) return Promise.resolve()
    if (scriptPromise) return scriptPromise

    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`
      script.async = true
      script.onload = () => {
        ready.value = true
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA'))
      document.head.appendChild(script)
    })

    return scriptPromise
  }

  async function execute(action: string): Promise<string> {
    if (!ready.value) await loadScript()
    if (!window.grecaptcha?.enterprise) {
      throw new Error('grecaptcha.enterprise not available')
    }

    return window.grecaptcha.enterprise.execute(siteKey, { action })
  }

  return { loadScript, execute, ready }
}