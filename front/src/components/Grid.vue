<script setup lang="ts">
// shared list resource
import { type ListData, type TagDoc, listData } from '@/composables/useFullApi'
const { data, loading, error, nextPage } = listData()

// scroll
import { ref, onUnmounted, watch, nextTick } from "vue"
const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null
const isPaginating = ref(false)
const hasMorePages = ref(true)

watch(sentinel, (el) => {
  if (observer) {
    try { observer.disconnect() } catch (e) {}
    observer = null
  }

  if (!el || !hasMorePages.value) return

  // const scrollContainer = el.closest('[data-reka-scroll-area-viewport]')
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (!entry.isIntersecting) return
    if (isPaginating.value) return
    isPaginating.value = true
    try { observer?.unobserve(entry.target) } catch (e) {}

    ;(async () => {
      try {
        const more = await nextPage()

        if (!more) {
          hasMorePages.value = false
          try { observer?.disconnect() } catch (e) {}
          observer = null
        } else {
          await nextTick()
          if (hasMorePages.value) {
            try { observer?.observe(entry.target) } catch (e) {}
          }
        }
      } catch (err) {
        await nextTick()
        try { observer?.observe(entry.target) } catch (e) {}
      } finally {
        isPaginating.value = false
      }
    })()
  })

  observer.observe(el)
})

onUnmounted(() => {
  try { observer?.disconnect() } catch (e) {}
})

// interacted resource
import { useInteractedData } from '@/composables/useInteractions'
const { getInteractionStatus } = useInteractedData<ListData>(data, {
  getDataId: (item) => item.documentId
})

// click out
import { useRouter } from 'vue-router'
const router = useRouter()
function clickOut(documentId: string) {
  router.push(`/${documentId}`)
}

// time ago
function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  
  return 'just now'
}

// components
import CategoryBadges from '@/components/Categories.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Timer, BriefcaseBusiness, Tags, MapPinned, Star, CircleCheck, CircleX } from 'lucide-vue-next'
import LoadingElement from '@/components/Loading.vue'

</script>
<template>
  <div v-if="loading" class="absolute inset-0 flex justify-center items-center"><LoadingElement/></div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <Table>
      <TableHeader class="dark:bg-black/10">
        <TableRow>
          <TableHead class="dark:text-stone-300 text-stone-900"><Star :size="20" class="m-auto"/></TableHead>
          <TableHead class="dark:text-stone-300 text-stone-900"><MapPinned :size="20" class="ml-5"/></TableHead>
          <TableHead class="dark:text-stone-300 text-stone-900"><Timer :size="20" class="ml-3"/></TableHead>
          <TableHead class="dark:text-stone-300 text-stone-900 pl-4"><BriefcaseBusiness :size="20" class="m-auto"/></TableHead>
          <TableHead class="dark:text-stone-300 text-stone-900 pl-4"><Tags :size="20" class="m-auto"/></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="job in data"
          :key="job.documentId"
          class="cursor-pointer select-none hover:bg-muted/50 text-stone-900 dark:text-stone-100"
          :class="{
            'cursor-auto opacity-50 select-none hover:bg-muted/0': getInteractionStatus(job.documentId).value.hasInteraction
          }"
          @click="!getInteractionStatus(job.documentId).value.hasInteraction && clickOut(job.documentId)"
        >
          <TableCell class="text-center pl-4 min-w-14">
            <CircleCheck class="m-auto text-emerald-300" :size="20" v-if="getInteractionStatus(job.documentId).value.flavor === 'like'"/>
            <CircleX class="m-auto text-rose-400" :size="20" v-if="getInteractionStatus(job.documentId).value.flavor === 'dislike'"/>
          </TableCell>
          <TableCell class="text-xs">
            <Badge v-if="job.job_is_remote" variant="secondary">
              Remote
            </Badge>
            <div v-else>{{ job.job_location }}</div>
          </TableCell>
          <TableCell class="text-xs ">
            {{ timeAgo(job.job_posted_at_datetime_utc) }}
          </TableCell>
          <TableCell class="text-ellipsis overflow-hidden max-w-0 min-w-[30vw] font-medium">
            <Badge variant="outline" class="mr-2">{{ job.employer_name }}</Badge>
            <span class="text-xs">{{ job.job_title }}</span>
          </TableCell>
          <TableCell class="max-w-0 min-w-[30vw] gap-2 flex">
            <CategoryBadges :categoryBadges="job.tags" />
          </TableCell>
        </TableRow>
        <TableRow v-if="hasMorePages">
          <TableCell colspan="4">
            <div ref="sentinel" class="h-4">
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>