<script setup lang="ts">

interface Props {
  documentId: string
}

// shared resource
const props = defineProps<Props>()
import { getSingleData } from '@/composables/useDetailApi'
const { data, loading, error } = getSingleData(props.documentId)

// error watching
import { useRouter } from 'vue-router'
import { watch } from 'vue'
const router = useRouter()

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      router.push({ path: '/' })
    }, 750)
  }
}, { immediate: true })

// relative date
import { computed, ref } from 'vue'
import { UseGodCol } from '@/composables/useGodCol'
const { relativeDateLabel } = UseGodCol()
const age = computed(() => {
  if (!data.value) return null
  return relativeDateLabel(data.value.job_posted_at_datetime_utc || data.value.updatedAt)
})

// benefits
const benefits = computed(() => {
  if (data.value === null) return null
  if (Array.isArray(data.value.job_benefits)) {
    return data.value.job_benefits.join('<br />')
  }

  return data.value.job_benefits
})

// categories
import { type TagDoc } from '@/composables/useFullApi'
import { Categories, type CategorySet, categoryColors } from '@/composables/useTagApi'
const categories = computed(() => {
  if (data.value === null) return null
  const tags: TagDoc[] | undefined = data.value.tags
  if (!tags) return null

  return tags.reduce((acc: any, current: any) => {
    const { category, value } = current
    acc[category] = acc[category] || []
    acc[category].push(value)
    return acc
  }, {})
});

// description
const showFullDescription = ref(false)
const truncatedDescription = computed(() => {
  if (!data.value) return ""
  const desc = data.value.job_description || ""
  if (desc.length <= 500 || showFullDescription.value) return desc
  return desc.slice(0, 500) + "..."
})

// interacted
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const interacted = computed(() => {
  if (data.value === null) return null
  const documentId = data.value.documentId
  if (!documentId) return null

  return interactionStore.getFlavor(documentId)
})

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CircleX, CircleCheck, X } from 'lucide-vue-next'
</script>

<template>
  <div class="w-full h-full flex items-center justify-center">
    <div v-if="loading"></div>
    <div v-else-if="error" class="w-full h-full flex justify-center items-center">
      <Card @click.stop="" class="w-3xl h-[58em] max-h-[90vh] shadow-lg rounded-none flex">
        <CardHeader class="flex flex-row items-center justify-center gap-4">
          Error: {{ error }}
        </CardHeader>
      </Card>
    </div>
    <Card @click.stop="" v-else-if="data" class="flex flex-col w-3xl h-[58em] max-h-[80vh] shadow-lg rounded-none overflow-hidden">
      <!-- header -->
      <CardHeader class="flex flex-row flex-wrap items-center gap-4">
        <span>{{ age }}</span><span>{{ data.job_employment_type }}</span>
        <span class="grow flex justify-end">
          <X @click="router.push('/')" class="cursor-pointer text-muted-foreground hover:text-primary" />
        </span>
        <span class="font-semibold text-3xl w-full">{{ data.job_title }}</span>
        <span class="font-medium">{{ data.employer_name }}</span>
        <div class="w-[3px] h-[3px] rounded-sm mx-0.5 bg-primary"></div>
        <span class="font-medium">{{ data.job_location }}</span>
      </CardHeader>

      <!-- content -->
      <CardContent class="space-y-4 grow-1 overflow-hidden">
        <!-- categories -->
        <span class="w-full gap-x-1 leading-[0.75em] font-light dark:font-thin flex items-center justify-start" v-for="(group, name) in categories as CategorySet">
          <div class="w-1.5 h-1.5 rounded-sm mx-0.5" :class="[categoryColors[name as Categories]]"></div>
          <template v-for="(word, index) in group" :key="index">
            <span class="tracking-wide whitespace-nowrap">{{ word }}<span v-if="index < (group.length ?? 0) - 1">,</span></span>
          </template>
        </span>
        <div class="flex font-light gap-4 leading-[1.69em]">
          <div class="w-[50%] overflow-hidden">
            <div v-if="data.job_description" class="font-medium">Description</div>
            {{ data.job_description }}
          </div>
          <div class="w-[50%]">
            <div v-if="data.job_benefits" class="font-medium">Benefits</div>
            <div v-html="benefits"></div>
          </div>
        </div>
        
      </CardContent>

      <!-- footer -->
      <CardFooter v-if="false" class="flex justify-center gap-10 items-center">
        <!-- interaction -->
        <div
          class="cursor-pointer scale-200 p-1 hover:bg-secondary rounded-sm"
          variant="ghost"
          @click.stop="interactionStore.setInteraction(data.documentId, 'like')"
        >
          <CircleCheck :class="[interacted === 'like' ? 'text-primary' : 'text-muted-foreground']" />
      </div>
      <div
          class="cursor-pointer scale-200 p-1 hover:bg-secondary rounded-sm"
          variant="ghost"
          @click.stop="interactionStore.setInteraction(data.documentId, 'like')"
        ><CircleX :class="interacted === 'dislike' ? 'text-primary' : 'text-muted-foreground'"/></div>
        
      </CardFooter>
    </Card>

    <div v-else>No data found</div>
  </div>
</template>
