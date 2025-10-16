<script setup lang="ts">
// data
import { categoryColors, Categories, type CategorySet } from '@/composables/useTagApi'
import { type InteractionFlavor } from '@/stores/interaction'
import { type GodColCell } from '@/composables/useGodCol'
const props = defineProps<{
  params: {
    value: GodColCell
  }
}>()

// interacted
import { computed } from 'vue';
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const interacted = computed(() => {
  const documentId = props.params.value?.documentId
  if (!documentId) return null

  return interactionStore.getFlavor(documentId)
})

function handleInteraction(flavor: InteractionFlavor) {
  interactionStore.queueInteraction(
    props.params.value.documentId,
    props.params.value.title?.join(' ') || '',
    flavor
  )
}

// components / static
import { Button } from './ui/button'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import Skeleton from './ui/skeleton/Skeleton.vue';
</script>
<template>

  <!-- skeleton -->
  <div v-if="!params.value.title" class="pt-1 gap-x-1 text-base w-full h-full overflow-hidden">
    <Skeleton class="h-[0.9rem] w-[90%]" />
    <Skeleton class="h-[0.9rem] w-[75%] mt-[0.7rem]" />
    <Skeleton class="h-[0.9rem] w-[97%] mt-[0.7rem]" />
    <Skeleton class="h-[0.9rem] w-[65%] mt-[0.7rem]" />
  </div>
  <div :data-interaction="interacted" v-if="params.value.title" class="god-cell leading-[var(--app-md-spacing)] gap-x-1 text-base w-full flex flex-wrap items-center justify-start">
    <!-- age -->
    <span class="font-light mr-1">[{{ params.value.relativeDate }}]</span>
    <div class="font-light text-muted-foreground truncate max-w-[9em]">{{ params.value.datetime }}</div>

    <!-- title -->
    <template v-for="(word, index) in params.value.title" :key="index">
      <span class="tracking-wide whitespace-nowrap font-light">{{ word }}</span>
    </template>

    <!-- interaction -->
    <Button
      class="interaction-button--like text-muted-foreground ml-1 cursor-pointer h-full w-auto shrink-0"
      variant="ghost"
      size="icon"
      @click.stop="handleInteraction('like')"
    ><CircleCheck /></Button>
    <Button
      class="interaction-button--dislike text-muted-foreground mr-0.5 cursor-pointer h-full w-auto shrink-0.5"
      variant="ghost"
      size="icon"
      @click.stop="handleInteraction('dislike')"
    ><CircleX/></Button>

    <!-- employer -->
    <span class="font-light dark:font-light">{{ params.value.employer }}</span>

    <!-- dot -->
    <div class="w-[3px] h-[3px] rounded-sm mx-0.5"></div>

    <!-- location -->
    <span class="font-light dark:font-light">{{ params.value.location }}</span>

    <!-- distance -->
    <!--
    <Badge
      class="h-[1rem] mx-1 ml-2 pr-2.5 pt-1 font-light dark:font-thin text-xs uppercase tracking-wider"
      :style="{ 'backgroundColor': '--var(--background)', 'color': '--var(--primary)', 'borderColor': 'oklch(37.4% 0.01 67.558)' }"
    >240 Miles</Badge>
    -->

    <!-- categories -->
    <span class="gap-x-1 font-light dark:font-light flex items-center" v-for="(group, name) in params.value?.categories as CategorySet">
      <div class="category-color-dot w-1.5 h-1.5 rounded-sm mx-0.5" :class="[categoryColors[name as Categories]]"></div>
      <template v-for="(item, index) in group" :key="index">
        <span
          class="uppercase tracking-wide whitespace-nowrap"
          :class="[
            item.quantifier === 'required' ? 'underline' : ''
          ]"
        >{{ item.val }}<span v-if="index < (group.length ?? 0) - 1">,</span></span>
      </template>
    </span>

    <!-- dot -->
    <div class="w-[3px] h-[3px] rounded-sm"></div>

    <!-- description -->
    <template v-for="(word, index) in params.value.description" :key="index">
      <span class="font-light dark:font-light whitespace-nowrap">{{ word }}</span>
    </template><span class="font-light dark:font-light whitespace-nowrap">...</span>


  </div>
</template>
<style scoped>

.god-cell[data-interaction='dislike'] .interaction-button--dislike {
  color: var(--primary);
}
.god-cell[data-interaction='like'] .interaction-button--like {
  color: var(--primary);
}
.god-cell[data-interaction='dislike'] .category-color-dot {
  @apply opacity-30
}
.god-cell[data-interaction] span {
  color: var(--muted-foreground);
}
</style>
