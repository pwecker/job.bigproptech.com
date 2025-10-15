<script lang="ts" setup>

// route prop
import { computed } from 'vue'
import { useRoute, type RouteLocationNormalized } from 'vue-router'
const route = useRoute()
const currentId = computed(() => route.params.key as string)

// auth
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { preTeased, isAuthenticated } = storeToRefs(authStore)
const forceLogin = ref(false)
const forceLoginPrompt = computed(() => {
  return forceLogin.value && !isAuthenticated.value
})

// single data
import { getSingleData } from '@/composables/useDetailApi'
const currentData = computed(() => {
  const { data: singleData, loading: loadingSingle, error: errorSingle } = getSingleData(currentId.value)
  return singleData.value
})

// list data
import { listData } from '@/composables/useFullApi'
const { data, loading, getIndexById } = listData()

// stack
import { useInteractedData } from '@/composables/useInteractions'
const lastUp = ref(false)
const currentItemIndex = computed(() => getIndexById(currentId.value))
const { uninteractedChunk, getInteractionStatus } = useInteractedData(data, {
  getDataId: (item) => item.documentId,
  filter: (item) => item.datum.documentId !== currentId.value,
  limit: 2,
  center: currentItemIndex,
})

const stack = computed<string[]>(() => {
  const current = currentId.value
  if (!current) return []

  // todo: authing on an interacted document tricks the stack

  const status = getInteractionStatus(current).value
  if (status?.hasInteraction) return [current]

  const next = uninteractedChunk.value?.map(item => item.datum.documentId) ?? []

  lastUp.value = next[0] === next[1]
  const random = next[Math.floor(Math.random() * next.length)]
  return [current, random]
})

// interaction
import { type InteractionFlavor, useInteractionStore } from '@/stores/interaction'
const { queueInteraction } = useInteractionStore()
import { useRouter } from 'vue-router'
const router = useRouter()
const handleInteraction = (payload: { documentId: string, jobTitle: string, flavor: InteractionFlavor }): void => {

  const nextUp = stack.value[1]
  carouselKey.value = `next:${nextUp}`
  if (preTeased.value && !isAuthenticated.value) {
    forceLogin.value = true
    const intendedRoute = {
      ...route,
      fullPath: `/${stack.value[1]}`,
      path: `/${stack.value[1]}`,
      params: { key: stack.value[1] }
    } as RouteLocationNormalized
    authStore.setIntendedRoute(intendedRoute)
  }

  if (!forceLoginPrompt.value) {
    if (nextUp) {
      router.push({ path: `/${nextUp}` })
    } else {
      router.push({ path: '/' })
    }
  }

  const { documentId, jobTitle, flavor } = payload
  queueInteraction(documentId, jobTitle, flavor)
  
}

// carousel
import { ref } from 'vue'
import { type CarouselApi } from '@/components/ui/carousel'
const api = ref<CarouselApi>()
const relativeProgress = ref(0)
const prevSnap = ref<number | null>(null)
const locked = ref(false)

const carouselKey = ref(currentId.value)

watchOnce(isAuthenticated, () => {
  carouselKey.value = 'loggedin'
})

function setApi(val?: CarouselApi) {
  if (!val) return
  api.value = val
  prevSnap.value = val.selectedScrollSnap()

  val.on('scroll', (embla) => {
    if (locked.value || !isMounted.value) return

    const snaps = embla.scrollSnapList()
    const selected = embla.selectedScrollSnap()
    const progress = embla.scrollProgress()

    if (prevSnap.value !== null && selected !== prevSnap.value) {
      relativeProgress.value = selected - prevSnap.value
      locked.value = true
      prevSnap.value = selected
      outroAnimation.value = true

      const timeoutId = setTimeout(() => {
        if (!isMounted.value) return
        locked.value = false
        outroAnimation.value = false

        // handleInteraction
        if (currentData.value) {
          const { documentId, job_title: jobTitle } = currentData.value
          const flavor = relativeProgress.value > 0 ? 'dislike' : 'like'
          handleInteraction({documentId, jobTitle, flavor})
        }

        relativeProgress.value = 0
      }, 250)

      timeouts.value.push(timeoutId)
      return
    } else if (uninteractedChunk.value === null) {
      const timeoutId = setTimeout(() => {
        locked.value = false
        relativeProgress.value = 0
        outroAnimation.value = false
        router.push({ path: `/` })
      }, 350)

      timeouts.value.push(timeoutId)
    }

    const currentSnap = snaps[selected]
    const nextSnap = snaps[selected + 1]

    if (nextSnap !== undefined && progress !== currentSnap) {
      const distance = nextSnap - currentSnap
      relativeProgress.value = (progress - currentSnap) / distance
    }
  })
}

const carouselOpts = computed(() => {
return {
  align: 'start' as const,
  loop: false,
  startIndex: 1,
  watchDrag: !forceLoginPrompt.value
}})

// bg click emit
const emit = defineEmits<{
  (e: 'backgroundClick'): void
}>()

const handleBgClick = () => {
  if (!forceLoginPrompt.value) {
    emit('backgroundClick')
  }
}

// unmount
import { onUnmounted } from 'vue'
const isMounted = ref(true)
const timeouts = ref<NodeJS.Timeout[]>([])
const outroAnimation = ref(false)

onUnmounted(() => {
  isMounted.value = false
  timeouts.value.forEach(id => clearTimeout(id))
  timeouts.value = []

  if (api.value) {
    api.value.destroy()
  }
})

// components
import DataDetail from '@/components/Detail.vue'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import Login from '@/components/Login.vue'
import { watchOnce } from '@vueuse/core'
</script>
<template>
<div class="w-full h-full relative flex items-center justify-center">
  <Carousel
    v-if="!loading"
    class="absolute inset-0 z-3"
    :opts="carouselOpts"
    :key="carouselKey"
    @init-api="setApi"
    @click="handleBgClick"
  >
    <CarouselContent class="h-dvh w-full m-0">
      <CarouselItem></CarouselItem>
      <CarouselItem
        class="p-0 w-full h-full flex justify-center items-center"
      >
        <div class="cardstack relative">
          <Transition appear name="card-0">
            <div
              v-if="stack[0]"
              :key="stack[0]"
              class="h-full absolute inset-0 bg-background overflow-hidden"
              :style="`--delay-leave: ${0}s; --delay-enter: ${0.125}s`"
              :class="[forceLoginPrompt ? 'border-1 border-accent' : '']"
            >
              <Login v-if="forceLoginPrompt" />
              <DataDetail v-else :documentId="stack[0]" @interaction="handleInteraction"/>
            </div>
          </Transition>
        </div>
      </CarouselItem>
      <CarouselItem></CarouselItem>
    </CarouselContent>
  </Carousel>

  <div class="cardstack relative">

    <Transition appear name="card-1">
      <div
        v-if="stack[1]"
        class="absolute w-full h-full bg-background overflow-hidden"
        :class="[
          'z-2',
          'translate-x-[var(--app-sm-spacing)] -translate-y-[var(--app-sm-spacing)]',
          ((preTeased || forceLogin) && !isAuthenticated) ? 'border-1 border-accent' : ''
        ]"
        :key="stack[1]"
        :style="`--delay-leave: ${0.125}s; --delay-enter: ${0.25}s`"
      >
        <Login v-if="(preTeased || forceLogin) && !isAuthenticated" />
        <DataDetail v-else :documentId="stack[1]" @interaction="handleInteraction"/>
      </div>
    </Transition>

    <Transition appear name="card-2">
      <div
        v-if="stack[1] && !lastUp"
        class="absolute w-full h-full bg-background"
        :class="[
          'z-1',
          'translate-x-[calc(var(--app-sm-spacing)*2)] -translate-y-[calc(var(--app-sm-spacing)*2)]'
        ]"
        :style="`--delay-leave: ${0.25}s; --delay-enter: ${0.375}s`"
        :key="`after:${stack[1]}`"
      ><DataDetail :documentId="null"/></div>
    </Transition>

  </div>

  <!-- interaction icon -->
  <div :class="{ 'animate-scale-fade-out': outroAnimation }" class="z-4 pointer-events-none absolute inset-0 flex justify-center items-center text-ring">
    <CircleCheck v-if="relativeProgress < 0" :style="{ opacity: (relativeProgress * -1) }" class="w-[12rem] h-[12rem]"/>
    <CircleX v-if="relativeProgress > 0" :style="{ opacity: relativeProgress }" class=" w-[12rem] h-[12rem]"/>
  </div>

</div>
</template>
<style scoped>

.card {
  width: calc(162vh - 500px);
  height: calc(100vh - 200px);
}

.cardstack {
  width: calc(92% - (var(--app-xl-spacing)));
  height: calc(100% - ((var(--app-xl-spacing)) + (var(--app-sm-spacing) + var(--app-header-height) + var(--app-footer-height))));
}

/* card 0 */
.card-0-enter-active {
  transition: transform 0.25s calc(var(--delay-enter)) ease-in-out, opacity 0.25s calc(var(--delay-enter)) ease-in-out;
}
.card-0-leave-active {
  transition: transform 0.25s calc(var(--delay-leave)) ease-in-out, opacity 0.25s calc(var(--delay-leave)) ease-in-out;
}

.card-0-enter-from {
  transform: translate(calc(var(--app-sm-spacing)*1), calc(var(--app-sm-spacing)*-1));
  opacity: 0;
}
.card-0-leave-to {
  transform: translate(calc(var(--app-sm-spacing)*-1), calc(var(--app-sm-spacing)*1));
  opacity: 0;
}

/* card 1 */
.card-1-enter-active {
  transition: transform 0.25s calc(var(--delay-enter)) ease-in-out, opacity 0.25s calc(var(--delay-enter)) ease-in-out;
}
.card-1-leave-active {
  transition: transform 0.25s calc(var(--delay-leave)) ease-in-out, opacity 0.25s calc(var(--delay-leave)) ease-in-out;
}

.card-1-enter-from {
  transform: translate(calc(var(--app-sm-spacing)*1), calc(var(--app-sm-spacing)*-1));
  opacity: 0;
}
.card-1-leave-to {
  transform: translate(calc(var(--app-sm-spacing)*-1), calc(var(--app-sm-spacing)*1));
  opacity: 1;
}

/* card 2 */
.card-2-enter-active {
  transition: transform 0.25s calc(var(--delay-enter)) ease-in-out, opacity 0.25s calc(var(--delay-enter)) ease-in-out;
}
.card-2-leave-active {
  transition: transform 0.25s calc(var(--delay-leave)) ease-in-out, opacity 0.25s calc(var(--delay-leave)) ease-in-out;
}

.card-2-enter-from {
  transform: translate(calc(var(--app-sm-spacing)*1), calc(var(--app-sm-spacing)*-1));
  opacity: 0;
}
.card-2-leave-to {
  transform: translate(calc(var(--app-sm-spacing)*-1), calc(var(--app-sm-spacing)*1));
  opacity: 1;
}

/* icon layer outro */
@keyframes scale-fade-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

.animate-scale-fade-out {
  animation: scale-fade-out 0.5s forwards;
}
</style>