<script setup lang="ts">

// data
import { type InteractionFlavor } from '@/stores/interaction'
import { type ListData, type TagDoc } from '@/composables/useFullApi';
import { defineProps } from 'vue'
const props = defineProps<{
  params: {
    data: ListData
  }
}>()

// interaction store
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()

// computed values
import { computed } from 'vue'

// age
const relativeDateLabel = computed(() => {
  const utcString = props.params.data?.job_posted_at_datetime_utc || props.params.data?.updatedAt
  if (!utcString) return null

  const inputDate = new Date(utcString)
  if (isNaN(inputDate.getTime())) {
    throw new Error(`Invalid date string: ${utcString}`)
  }

  const now = new Date()
  const diffMs = now.getTime() - inputDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Normalize to start of week (Monday as start)
  const getWeekStart = (d: Date) => {
    const date = new Date(d)
    const day = date.getDay() // 0 = Sun, 1 = Mon...
    const diff = (day === 0 ? -6 : 1) - day
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + diff)
    return date
  }

  const startOfThisWeek = getWeekStart(now)
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

  if (diffDays < 1) {
    return 'New'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (inputDate >= startOfThisWeek) {
    return 'This week'
  } else if (inputDate >= startOfLastWeek) {
    return 'Last week'
  } else if (diffDays < 60) {
    return 'Weeks ago'
  } else {
    return 'Months ago'
  }
})

// interacted
const interacted = computed(() => {
  const documentId = props.params.data?.documentId
  if (!documentId) return null

  return interactionStore.getFlavor(documentId)
})

// categories
import { Categories } from '@/composables/useTagApi'
const categories = computed(() => {
  const tags: TagDoc[] | undefined = props.params.data?.tags
  if (!tags) return null

  return tags.reduce((acc: any, current: any) => {
    const { category, value } = current
    acc[category] = acc[category] || []
    acc[category].push(value)
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

type CategorySet = Record<Categories, string[]>
type CategoryColors = Record<Categories, string>
const categoryColors: CategoryColors = {
  [Categories.ProgrammingLanguage]: 'dark:bg-indigo-300',
  [Categories.Framework]: 'dark:bg-teal-500',
  [Categories.CloudPlatform]: 'dark:bg-indigo-400',
  [Categories.Database]: 'dark:bg-red-500',
  [Categories.DevopsTool]: 'dark:bg-orange-300',
  [Categories.Testing]: 'dark:bg-orange-300',
  [Categories.SecurityClearance]: 'dark:bg-slate-600',
  [Categories.EducationLevel]: 'dark:bg-yellow-200',
  [Categories.DegreeField]: 'dark:bg-yellow-200',
  [Categories.Compensation]: 'dark:bg-emerald-300',
  [Categories.Benefits]: 'dark:bg-emerald-300',
  [Categories.WorkArrangement]: 'dark:bg-sky-500',
  [Categories.EmploymentType]: 'dark:bg-sky-500',
  [Categories.PerksCulture]: 'dark:bg-sky-500'
}

</script>
<template>
  <div class="gap-x-1 leading-[1.39rem] pt-1 text-md w-full flex flex-wrap items-center justify-start">

    <!-- distance -->
    <Badge
      class="-ml-2 h-[1rem] pr-2.5 pt-1 font-thin text-xs uppercase tracking-wider"
      :style="{ 'backgroundColor': '--var(--background)', 'color': '--var(--primary)', 'borderColor': 'oklch(37.4% 0.01 67.558)' }"
    >
      {{ relativeDateLabel }}
    </Badge>

    <!-- title -->
    <template v-for="(word, index) in title" :key="index">
      <span class="tracking-wide whitespace-nowrap">{{ word }}</span>
    </template>

    <!-- interaction -->
    <Button
      class="ml-1 cursor-pointer h-full w-auto shrink-0"
      variant="ghost"
      size="icon"
      @click.stop="interactionStore.setInteraction(params.data?.documentId, 'like')"
    ><CircleCheck :class="interacted === 'like' ? 'text-stone-100' : 'text-stone-700'" /></Button>
    <Button
      class="mr-0.5 cursor-pointer h-full w-auto shrink-0.5"
      variant="ghost"
      size="icon"
      @click.stop="interactionStore.setInteraction(params.data?.documentId, 'dislike')"
    ><CircleX :class="interacted === 'dislike' ? 'text-stone-100' : 'text-stone-700'"/></Button>

    <!-- employer -->
    <span class="font-thin">{{ params.data?.employer_name }}</span>

    <!-- dot -->
    <div class="w-[3px] h-[3px] rounded-sm bg-stone-100 mx-0.5"></div>

    <!-- location -->
    <span class="font-thin">{{ params.data?.job_location }}</span>

    <!-- distance -->
    <!--
    <Badge
      class="h-[1rem] mx-1 ml-2 pr-2.5 pt-1 font-thin text-xs uppercase tracking-wider"
      :style="{ 'backgroundColor': '--var(--background)', 'color': '--var(--primary)', 'borderColor': 'oklch(37.4% 0.01 67.558)' }"
    >240 Miles</Badge>
    -->

    <!-- categories -->
    <span class="gap-x-1 font-thin flex items-center" :class="!!interacted ? 'opacity-40' : ''" v-for="(group, name) in categories as CategorySet">
      <div class="w-1.5 h-1.5 rounded-sm mx-0.5" :class="[categoryColors[name as Categories], !!interacted ? 'opacity-15': '']"></div>
      <template v-for="(word, index) in group" :key="index">
        <span class="uppercase tracking-wide whitespace-nowrap">{{ word }}<span v-if="index < (group.length ?? 0) - 1">,</span></span>
      </template>
    </span>

    <!-- dot -->
    <div class="w-[3px] h-[3px] rounded-sm bg-stone-100 mx-0.5" :class="!!interacted ? 'opacity-40' : ''"></div>

    <!-- description -->
    <template v-for="(word, index) in description" :key="index">
      <span class="font-thin whitespace-nowrap" :class="!!interacted ? 'opacity-40' : ''">{{ word }}</span>
    </template><span class="font-thin whitespace-nowrap">...</span>

  </div>
</template>