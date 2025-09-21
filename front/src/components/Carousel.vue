<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const currentId = computed(() => route.params.key as string)

import { listData } from '@/composables/useFullApi'

import { useInteractionStore } from '@/stores/interaction'
const { queueInteraction } = useInteractionStore()

import { useInteractedData } from '@/composables/useInteractions'
const { data, loading, getIndexById } = listData()

// outro
const outroAnimation = ref(false)

// carousel api
import { type CarouselApi } from '@/components/ui/carousel'
const api = ref<CarouselApi>()
const relativeProgress = ref(0)
const prevSnap = ref<number | null>(null)
const locked = ref(false)

// neighbors
const currentItemIndex = computed(() => getIndexById(currentId.value))
const { uninteractedChunk, getInteractionStatus } = useInteractedData(data, {
  getDataId: (item) => item.documentId,
  limit: 2,
  center: currentItemIndex.value
})
const currentItemInteraction = getInteractionStatus(currentId.value)
const relativeItems = computed(() => 
  uninteractedChunk.value === null ? ['', currentId.value, ''] : [
    uninteractedChunk.value[0].datum.documentId,
    currentId.value,
    uninteractedChunk.value[1].datum.documentId
  ]
)

function setApi(val?: CarouselApi) {
  if (!val) return
  api.value = val
  prevSnap.value = val.selectedScrollSnap()

  val.on('scroll', (embla) => {
    if (locked.value) return

    const snaps = embla.scrollSnapList()
    const selected = embla.selectedScrollSnap()
    const progress = embla.scrollProgress()

    if (prevSnap.value !== null && selected !== prevSnap.value) {
      relativeProgress.value = selected - prevSnap.value
      locked.value = true
      prevSnap.value = selected
      outroAnimation.value = true

      setTimeout(() => {
        locked.value = false
        relativeProgress.value = 0
        outroAnimation.value = false
        
        const targetId = relativeItems.value[selected]
        if (targetId) {
          router.push({ path: `/${targetId}` })
        } else {
          router.push({ path: `/` })
        }
      }, 500)

      if (data.value && currentItemIndex.value > -1) {
        const interactedItem = data.value[currentItemIndex.value]
        queueInteraction(interactedItem, relativeProgress.value > 0 ? 'dislike' : 'like')
      }
      return
    } else if (uninteractedChunk.value === null) {
      setTimeout(() => {
        locked.value = false
        relativeProgress.value = 0
        outroAnimation.value = false
        router.push({ path: `/` })
      }, 350)
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

// computed
const centerIndex = computed(() => Math.floor(relativeItems.value.length / 2))
const currentItem = computed(() => 
  currentItemInteraction.value.hasInteraction ? currentId.value : relativeItems.value[centerIndex.value]
)

// components
import DataDetail from '@/components/Detail.vue'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { CircleCheck, CircleX } from 'lucide-vue-next'
</script>

<template>
  <div class="relative w-full h-full">
    <Carousel
      v-if="!loading && relativeItems.length"
      class="w-full h-full"
      :opts="{ align: 'start', loop: false, startIndex: 1 }"
      :key="currentId"
      @init-api="setApi"
      @click="emit('backgroundClick')"
    >
      <CarouselContent class="h-dvh w-full">
        <CarouselItem
          v-for="(item, i) in relativeItems"
          class="flex justify-center items-center"
        >
        <div class="ml-4 w-full h-full flex justify-center items-center">
          <Transition name="carousel" mode="out-in" appear>
            <DataDetail v-if="i === centerIndex" :documentId="currentItem" />
          </Transition>
        </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious @click.stop="" />
      <CarouselNext @click.stop="" />
    </Carousel>

    <!-- fallback -->
    <div v-else-if="!loading && uninteractedChunk === null" class="flex items-center justify-center h-full">
      <p class="text-gray-500">No items</p>
    </div>

    <!-- interaction icon -->
    <div :class="{ 'animate-scale-fade-out': outroAnimation }" class="pointer-events-none absolute inset-0 flex justify-center items-center">
      <CircleCheck v-if="relativeProgress < 0" :style="{ opacity: (relativeProgress * -1) }" class="text-emerald-800 w-[12rem] h-[12rem]"/>
      <CircleX v-if="relativeProgress > 0" :style="{ opacity: relativeProgress }" class="text-rose-800 w-[12rem] h-[12rem]"/>
    </div>
  </div>
</template>

<style scoped>
/* carousel intro */
.carousel-enter-active,
.carousel-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.carousel-enter-from,
.carousel-leave-to {
  opacity: 0;
  transform: scale(0.95);
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