<script lang="ts" setup>

// route prop
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const currentId = computed(() => route.params.key as string)

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
  const id = currentId.value
  if (!id) return []

  const status = getInteractionStatus(id).value
  if (status?.hasInteraction) return [id]

  const next = uninteractedChunk.value?.map(item => item.datum.documentId) ?? []

  lastUp.value = next[0] === next[1]
  const random = next[Math.floor(Math.random() * next.length)]
  return [id, random]
})

// interaction
import { type InteractionFlavor, useInteractionStore } from '@/stores/interaction'
const { queueInteraction } = useInteractionStore()
import { useRouter } from 'vue-router'
const router = useRouter()
const handleInteraction = (payload: { documentId: string, jobTitle: string, flavor: InteractionFlavor }): void => {
  const nextUp = stack.value[1]
  if (nextUp) {
    router.push({ path: `/${nextUp}` })
  } else {
    router.push({ path: '/' })
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
        carouselKey.value = `reset:${stack.value[0]}`
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

// bg click emit
const emit = defineEmits<{
  (e: 'backgroundClick'): void
}>()

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
</script>
<template>
<div class="w-full h-full relative flex items-center justify-center">
  <Carousel
    v-if="!loading"
    class="absolute inset-0 z-3"
    :opts="{ align: 'start', loop: false, startIndex: 1 }"
    :key="carouselKey"
 
    @init-api="setApi"
    @click="emit('backgroundClick')"
  >
    <CarouselContent class="h-dvh w-full m-0">
      <CarouselItem></CarouselItem>
      <CarouselItem class="p-0 w-full h-full flex justify-center items-center">
        <div class="cardstack relative">
          <Transition appear name="card-0">
            <div
              v-if="stack[0]"
              :key="stack[0]"
              class="h-full absolute inset-0"
              :style="`--delay-leave: ${0}s; --delay-enter: ${0.1}s`"
            >
              <DataDetail :documentId="stack[0]" @interaction="handleInteraction"/>
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
        class="absolute w-full h-full bg-background"
        :class="[
          'z-2',
          'translate-x-[var(--app-sm-spacing)] -translate-y-[var(--app-sm-spacing)]'
        ]"
        :key="stack[1]"
        :style="`--delay-leave: ${0.1}s; --delay-enter: ${0.2}s`"
      ><DataDetail :documentId="stack[1]" @interaction="handleInteraction"/></div>
    </Transition>

    <Transition appear name="card-2">
      <div
        v-if="stack[1] && !lastUp"
        class="absolute w-full h-full bg-background"
        :class="[
          'z-1',
          'translate-x-[calc(var(--app-sm-spacing)*2)] -translate-y-[calc(var(--app-sm-spacing)*2)]'
        ]"
        :style="`--delay-leave: ${0.2}s; --delay-enter: ${0.3}s`"
        :key="`after:${stack[1]}`"
      ><DataDetail :documentId="null" @interaction="handleInteraction"/></div>
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
  transition: transform 0.5s calc(var(--delay-enter)) ease-in-out, opacity 0.5s calc(var(--delay-enter)) ease-in-out;
}
.card-0-leave-active {
  transition: transform 0.5s calc(var(--delay-leave)) ease-in-out, opacity 0.5s calc(var(--delay-leave)) ease-in-out;
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
  transition: transform 0.5s calc(var(--delay-enter)) ease-in-out, opacity 0.5s calc(var(--delay-enter)) ease-in-out;
}
.card-1-leave-active {
  transition: transform 0.5s calc(var(--delay-leave)) ease-in-out, opacity 0.5s calc(var(--delay-leave)) ease-in-out;
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
  transition: transform 0.5s calc(var(--delay-enter)) ease-in-out, opacity 0.5s calc(var(--delay-enter)) ease-in-out;
}
.card-2-leave-active {
  transition: transform 0.5s calc(var(--delay-leave)) ease-in-out, opacity 0.5s calc(var(--delay-leave)) ease-in-out;
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