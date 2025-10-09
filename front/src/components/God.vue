<script setup lang="ts">

// data
import { type InteractionFlavor } from '@/stores/interaction'
import { type ListData } from '@/composables/useFullApi';
const props = defineProps<{
  params: {
    data: ListData
  }
}>()

// computed values
import { computed } from 'vue'

// relative date
import { UseGodCol } from '@/composables/useGodCol'
const { relativeDateLabel } = UseGodCol()
const relativeDate = computed(() => {
  const utcString = props.params.data?.job_posted_at_datetime_utc || props.params.data?.updatedAt
  if (!utcString) return null
  return relativeDateLabel(utcString)
})

// interacted
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const interacted = computed(() => {
  const documentId = props.params.data?.documentId
  if (!documentId) return null

  return interactionStore.getFlavor(documentId)
})

// use categories
import { type TagDoc } from '@/composables/useFullApi'
import { Categories, type CategorySet, categoryColors } from '@/composables/useTagApi'
const categories = computed(() => {
  if (props.params.data?.tags === null) return null
  const tags: TagDoc[] | undefined = props.params.data?.tags
  if (!tags) return null

  return tags.reduce((acc: any, current: any) => {
    const { category, value: val, quantifier } = current
    acc[category] = acc[category] || []
    acc[category].push({val, quantifier})
    return acc
  }, {})
});

// description
const description = computed(() => {
  const longtext: string | undefined = props.params.data?.job_description
  if (!longtext) return null
  
  const maxLength = 800
  return longtext
    .replace(/[\r\n\t]+/g, ' ')           // Replace newlines, returns, tabs with space
    .replace(/[^\w\s.,!?;:'"()-]/g, '')   // Remove special formatting chars (keep basic punctuation)
    .replace(/\s+/g, ' ')                 // Collapse multiple spaces into one
    .trim()                                // Remove leading/trailing whitespace
    .substring(0, maxLength)              // Truncate to max length
    .split(' ') || []
})

// title
const title = computed(() => {
  const titleText: string | undefined = props.params.data?.job_title
  if (!titleText) return null

  return titleText.split(' ') || [];
});

// components / static
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CircleCheck, CircleX } from 'lucide-vue-next'
import { Separator } from "@/components/ui/separator"

</script>
<template>
  <div :class="['!leading-[var(--app-md-spacing)]']" class="leading-[var(--app-md-spacing)] gap-x-1 pt-1 text-base w-full flex flex-wrap items-center justify-start">
    <!-- distance -->
    <span v-if="relativeDate" class="font-light mr-1">[{{ relativeDate }}]</span>

    <!-- title -->
    <template v-for="(word, index) in title" :key="index">
      <span class="tracking-wide whitespace-nowrap font-light" :class="interacted === 'dislike' ? 'text-primary' : 'text-primary'">{{ word }}</span>
    </template>

    <!-- interaction -->
    <Button
      class="ml-1 cursor-pointer h-full w-auto shrink-0"
      variant="ghost"
      size="icon"
      @click.stop="interactionStore.queueInteraction(params.data?.documentId, params.data?.job_title, 'like')"
    ><CircleCheck :class="interacted === 'like' ? 'text-primary' : 'text-muted'" /></Button>
    <Button
      class="mr-0.5 cursor-pointer h-full w-auto shrink-0.5"
      variant="ghost"
      size="icon"
      @click.stop="interactionStore.queueInteraction(params.data?.documentId, params.data?.job_title, 'dislike')"
    ><CircleX :class="interacted === 'dislike' ? 'text-primary' : 'text-muted'"/></Button>

    <!-- employer -->
    <span class="font-light dark:font-light" :class="interacted !== null ? 'text-primary' : 'text-primary'">{{ params.data?.employer_name }}</span>

    <!-- dot -->
    <div class="w-[3px] h-[3px] rounded-sm mx-0.5" :class="interacted !== null ? 'bg-primary' : 'bg-primary'"></div>

    <!-- location -->
    <span class="font-light dark:font-light" :class="interacted !== null ? 'text-primary' : 'text-primary'">{{ params.data?.job_location }}</span>

    <!-- distance -->
    <!--
    <Badge
      class="h-[1rem] mx-1 ml-2 pr-2.5 pt-1 font-light dark:font-thin text-xs uppercase tracking-wider"
      :style="{ 'backgroundColor': '--var(--background)', 'color': '--var(--primary)', 'borderColor': 'oklch(37.4% 0.01 67.558)' }"
    >240 Miles</Badge>
    -->

    <!-- categories -->
    <span class="gap-x-1 font-light dark:font-light flex items-center" :class="interacted === 'dislike' ? 'text-primary' : 'text-primary'" v-for="(group, name) in categories as CategorySet">
      <div class="w-1.5 h-1.5 rounded-sm mx-0.5" :class="[categoryColors[name as Categories], interacted === 'dislike' ? 'opacity-15': '']"></div>
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
    <div class="w-[3px] h-[3px] rounded-sm" :class="interacted !== null ? 'bg-primary' : 'bg-primary'"></div>

    <!-- description -->
    <template v-for="(word, index) in description" :key="index">
      <span class="font-light dark:font-light whitespace-nowrap" :class="interacted !== null ? 'text-primary' : 'text-primary'">{{ word }}</span>
    </template><span class="font-light dark:font-light whitespace-nowrap">...</span>

  </div>
</template>
