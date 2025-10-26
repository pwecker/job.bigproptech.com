<script setup lang="ts">
interface Props {
  documentId: string | null
}

// single resource
const props = defineProps<Props>()
import { computed } from 'vue'
import { getSingleData } from '@/composables/useDetailApi'
const { data, loading, error } = props.documentId ? getSingleData(props.documentId) : { data: ref(null), loading: ref(false), error: ref(null) }

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
import { ref } from 'vue'
import { UseGodCol } from '@/composables/useGodCol'
const { relativeDateLabel } = UseGodCol()
const age = computed(() => {
  if (!data.value) return null
  return relativeDateLabel(data.value.job_posted_at_datetime_utc || data.value.updatedAt)
})

// highlights
const highlights = computed(() => {
  if (data.value === null) return null
  if (Array.isArray(data.value.job_highlights)) {
    return data.value.job_highlights.join('<br />')
  }

  return data.value.job_highlights
})

// benefits
const benefits = computed(() => {
  if (data.value === null) return null
  if (Array.isArray(data.value.job_benefits)) {
    return data.value.job_benefits.join('<br />')
  }

  return data.value.job_benefits
})

// use categories
import { type Tag } from '@/composables/useFullApi'
import {
  Categories,
  Quantifiers,
  type CategorySet,
  type CategoryValue,
  type QuantifierKey,
  type GroupedByQuantifier,
  categoryColors
  ,
  QUANTIFIER_LABELS,
  isValidQuantifierKey,
  isValidCategory
} from '@/composables/useTagApi'

const categories = computed<GroupedByQuantifier | null>(() => {
  if (!data.value) return null
  const tags: Tag[] | undefined = data.value.tags
  if (!tags) return null

  return tags.reduce((acc, current) => {
    const { category, value: val, quantifier } = current
    const qKey = (quantifier ?? 'null') as QuantifierKey
    if (!acc[qKey]) acc[qKey] = {}
    if (!acc[qKey][category]) acc[qKey][category] = []

    const exists = acc[qKey][category].some((item: any) => item.val === val)
    if (!exists) {
      acc[qKey][category].push({
        val,
        quantifier: (quantifier as Quantifiers) ?? null
      })
    }

    return acc
  }, {} as GroupedByQuantifier)
})

const displayCategories = computed(() => {
  if (!categories.value) return null
  const { null: nullQuant, ...rest } = categories.value
  return rest as Partial<Record<Quantifiers, CategorySet>>
})

const getQuantifierLabel = (key: string | number): string => {
  const strKey = String(key) as QuantifierKey
  return QUANTIFIER_LABELS[strKey] || String(key)
}

const getCategoryColor = (key: string | number): string => {
  const strKey = String(key) as Categories
  return categoryColors[strKey] || ''
}

// interaction
import { type InteractionFlavor } from '@/stores/interaction'
const emit = defineEmits<{ (e: 'interaction', payload: { documentId: string, jobTitle: string, flavor: InteractionFlavor }): void }>();

// components
import { CircleX, CircleCheck, X } from 'lucide-vue-next'
import Loading from '@/components/Loading.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
import Separator from '@/components/ui/separator/Separator.vue'
</script>
<template>
  <div class="w-full h-full flex flex-col bg-background border-border text-xs md:text-sm border-1 p-[var(--app-xs-spacing)] pb-0! space-y-0">

    <Loading v-if="loading" />
    <template v-else-if="documentId">

    <!-- 1st section -->
    <div class="flex flex-col md:flex-row gap-[var(--app-sm-spacing)] md:gap-none px-[var(--app-md-spacing)] pt-[var(--app-md-spacing)] pb-[var(--app-md-spacing)]">
      <X :size="30" @click="router.push('/')" class="rounded-sm transition-colors cursor-pointer p-[var(--app-xs-spacing)] absolute top-[var(--app-xs-spacing)] right-[var(--app-xs-spacing)] hover:text-primary hover:bg-primary-foreground"/>

      <div class="flex-1 leading-[var(--app-md-spacing)]">

         <!-- age, datetime -->
         <div class="flex items-center gap-[var(--app-xs-spacing)]">
          <Badge variant="outline" class="border-border text-muted-foreground -ml-[1em] uppercase">{{ age }}</Badge>
            <span class="text-muted-foreground">{{ data?.job_posted_at_datetime_utc }}</span>
          </div>

          <!-- title, type -->
          <div class="w-full flex">
            <div class="truncate">{{ data?.job_title }}</div>
            <div class="pl-[var(--app-xs-spacing)] truncate">{{ data?.job_employment_type }}</div>
          </div>
          
          <!-- company, location, remote -->
          <div class="flex items-center md:gap-[var(--app-xs-spacing)]">
            <span>{{ data?.employer_name }}</span>
            <div v-if="data?.employer_name && data?.job_location" class="w-[3px] h-[3px] rounded-sm mx-0.5 bg-primary"></div>
            <span class="truncate">{{ data?.job_location }}</span>
            <span>
              <Badge variant="secondary" class="ml-[var(--app-xs-spacing)]">Remote</Badge>
            </span>
          </div>
      </div>

      <div class="flex-1 leading-[var(--app-md-spacing)] text-left md:text-right flex flex-col justify-end">

        <!-- segments -->
        <div class="relative" v-if="data?.segments">
          <Badge variant="outline" class="border-border text-muted-foreground my-[var(--app-sm-spacing)] md:my-[var(--app-xs-spacing)] -ml-[1em] uppercase">{{ data.segments[0].name }}{{ data.segments.length > 1 ? '...' : ''}}</Badge>
        </div>

        <div>
          <template v-if="data?.apply_options" v-for="option in data.apply_options.slice(0,10)" class="font-light">
            <a @click.stop="" class="w-full whitespace-nowrap text-muted-foreground hover:text-primary hover:underline" :href="option.apply_link" target="_blank">[ {{ option.publisher }} ]</a>
          </template>

          <template v-else-if="data?.job_apply_link">
            <a @click.stop="" class="w-full whitespace-nowrap hover:underline" :href="data?.job_apply_link" target="_blank">[ {{ data?.job_publisher || data?.employer_name || 'Direct Link' }} ]</a>
          </template>
        </div>

      </div>
    </div>

    <div class="flex justify-center mx-[var(--app-md-spacing)]">
      <Separator></Separator>
    </div>

    <!-- 2nd section -->
    <ScrollArea class="overflow-y-auto max-h-[30vh] leading-[var(--app-md-spacing)] px-[var(--app-sm-spacing)] my-[var(--app-sm-spacing)] md:my-[var(--app-md-spacing)]">

      <!-- categories -->
      <div
        v-if="displayCategories"
        class="flex flex-col md:flex-row uppercase tracking-wide gap-[var(--app-sm-spacing)] md:gap-none"
      >
      <template v-for="(categoriesByQuant, qKeyRaw) in displayCategories" :key="qKeyRaw">
        <div
          v-if="String(qKeyRaw) !== 'null'"
          class="flex flex-col basis-1/3 grow-1"
        >
          <legend class="w-full">
            <Badge 
              variant="outline" 
              class="border-border my-[var(--app-sm-spacing)] md:my-[var(--app-xs-spacing)]" 
              :class="[qKeyRaw === Quantifiers.Required ? 'text-primary' : 'text-muted-foreground']"
            >
            {{ getQuantifierLabel(qKeyRaw) }}
          </Badge>
          </legend>
          <template v-for="(items, categoryRaw) in categoriesByQuant" :key="categoryRaw">
            <div class="flex items-center flex-wrap pl-[var(--app-xs-spacing)]">
              <div
                class="w-1.5 h-1.5 rounded-sm mr-[var(--app-xs-spacing)]"
                :class="[getCategoryColor(categoryRaw)]"
              ></div>

              <div class="font-semibold mr-[var(--app-xs-spacing)] text-muted-foreground">{{ categoryRaw }}:</div>
              <div class="truncate flex-1">
                <template v-if="items" v-for="(item, index) in items" :key="index">
                  <span
                    :class="[item.quantifier === Quantifiers.Required ? 'underline' : '']"
                  >
                    {{ item.val }}
                  </span>
                  <span v-if="index < items.length - 1" class="mr-[var(--app-xs-spacing)]">,</span>
                
                </template>
              </div>
            </div>
            </template>
          </div>
        </template>
      </div>
    </ScrollArea>

    <div class="flex justify-center mx-[var(--app-md-spacing)]">
      <Separator></Separator>
    </div>

    <!-- 3rd section -->
    <ScrollArea class="flex-1 overflow-y-auto leading-[var(--app-md-spacing)]]">

      <div class="py-[var(--app-sm-spacing)] md:py-[var(--app-md-spacing)] px-[var(--app-md-spacing)]">

        <!-- description, highlights, benefits -->
        <template v-if="data?.job_description">
          <p class="text-muted-foreground my-[var(--app-sm-spacing)] md:my-[var(--app-xs-spacing)]">Description</p>
          <p>{{ data.job_description }}</p>
        </template>

        <template v-if="highlights">
          <Separator class="my-[var(--app-md-spacing)]"></Separator>
          <p class="text-muted-foreground my-[var(--app-sm-spacing)] md:my-[var(--app-xs-spacing)]">Highlights</p>
          <span v-for="(highlight, section) of data?.job_highlights">
            <p v-html="highlight"></p>
          </span>
        </template>

        <template v-if="benefits">
          <Separator class="my-[var(--app-md-spacing)]"></Separator>
          <p class="text-muted-foreground my-[var(--app-sm-spacing)] md:my-[var(--app-xs-spacing)]">Benefits</p>
          <span v-for="(highlight, section) of data?.job_benefits">
            <p v-html="highlight"></p>
          </span>
        </template>
      </div>

    </ScrollArea>

    <!-- interaction -->
    <div class="w-full flex justify-between py-[var(--app-xs-spacing)]">
      <Button
        variant="ghost"
        size="icon"
        @click="data?.documentId && data?.job_title && emit('interaction', { documentId: data.documentId, jobTitle: data.job_title, flavor: 'dislike' })"
        class="m-0 cursor-pointer"
      >
        <CircleX class="" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        @click="data?.documentId && data?.job_title && emit('interaction', { documentId: data.documentId, jobTitle: data.job_title, flavor: 'like' })"
        class="m-0 cursor-pointer"
      >
        <CircleCheck class="" />
      </Button>
    </div>

    </template>
  </div>
</template>