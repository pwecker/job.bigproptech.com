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

// use categories
import { type Tag } from '@/composables/useFullApi'
import { Categories, Quantifiers, type CategorySet, type CategoryValue, categoryColors } from '@/composables/useTagApi'

type QuantifierKey = `${Quantifiers}` | 'null'

interface GroupedByQuantifier {
  [key: string]: Partial<Record<Categories, CategoryValue[]>>
}

const quantifierLabels: Record<QuantifierKey, string> = {
  required: 'Required',
  preferred: 'Preferred',
  suggested: 'Suggested',
  null: 'Unspecified'
}

const categories = computed(() => {
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

// interaction
import { type InteractionFlavor } from '@/stores/interaction'
const emit = defineEmits<{ (e: 'interaction', payload: { documentId: string, jobTitle: string, flavor: InteractionFlavor }): void }>();

// components
import { CircleX, CircleCheck, X } from 'lucide-vue-next'
import Loading from '@/components/Loading.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge';
import ScrollArea from './ui/scroll-area/ScrollArea.vue';
</script>
<template>
    <div @click.stop="" class="p-[var(--app-md-spacing)] pb-0 relative w-full h-full border-accent border-1 transition-[width] flex flex-col justify-between bg-popover shadow-lg">
      
      <!-- close -->
      <X :size="30" @click="router.push('/')" class="rounded-sm transition-colors cursor-pointer p-[var(--app-xs-spacing)] absolute top-[var(--app-xs-spacing)] right-[var(--app-xs-spacing)] text-primary hover:text-primary hover:bg-primary-foreground"/>

      <Loading v-if="loading" />
      <div v-else-if="documentId" class="portrait:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] grid grid-cols-5 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-y-[var(--app-sm-spacing)] w-full h-full">
        <div class="row-start-1 col-start-1 col-span-4 row-span-1">

          <!-- age, datetime -->
          <div class="font-light lg:text-base text-xs flex gap-[var(--app-xs-spacing)] -ml-0.5">
            <span>[ {{ age }} ]</span>
            <span class="text-muted-foreground">{{ data?.job_posted_at_datetime_utc }}</span>
          </div>

          <!-- title, type -->
          <div class="font-light">{{ data?.job_title }}<span class="pl-[var(--app-xs-spacing)] text-muted-foreground">{{ data?.job_employment_type }}</span></div>
          
          <!-- company, location, remote -->
          <div class="flex items-center font-light lg:text-base text-xs gap-[var(--app-xs-spacing)]">
            <span>{{ data?.employer_name }}</span>
            <div v-if="data?.employer_name && data?.job_location" class="w-[3px] h-[3px] rounded-sm mx-0.5 bg-primary"></div>
            <span>{{ data?.job_location }}</span>
            <span>
              <Badge variant="secondary">Remote</Badge>
            </span>
          </div>

        </div>
        <!-- <div class="portrait:col-span-5 row-start-2 col-start-1 col-span-4 row-span-1"> -->
        
        <!-- </div> -->
        <div class="portrait:row-start-2 portrait:col-start-1 portrait:row-span-1 portrait:col-span-5 row-start-1 col-start-5 row-span-3">

          <!-- apply options -->
          <div class="pt-[var(--app-xs-spacing)] portrait:p-0 flex portrait:flex-row portrait:flex-wrap overflow-x-auto flex-col leading-[var(--app-sm-spacing)]">
            <span class="portrait:w-full"><Badge v-for="segment in data?.segments" variant="outline" class="border-border text-muted-foreground ml-0.5">{{ segment.name }}</Badge></span>
            <div v-for="option in data?.apply_options" class="font-light">
              <a @click.stop="" class="w-full lg:text-sm text-xs whitespace-nowrap hover:underline" :href="option.apply_link" target="_blank">[ {{ option.publisher }} ]</a>
            </div>
            <!-- todo: skip if apply_options -->
            <div v-if="data?.job_apply_link">
              <a @click.stop="" class="w-full lg:text-sm text-xs whitespace-nowrap hover:underline" :href="data?.job_apply_link" target="_blank">[ {{ data?.job_publisher || data?.employer_name || 'Direct Link' }} ]</a>
            </div>
          </div>
        </div>

        <ScrollArea class="portrait:col-span-5 row-start-3 col-start-1 col-span-4 portrait:row-span-2 overflow-y-auto">

          <!-- categories -->
          <div
            v-if="categories"
            class="flex flex-col gap-y-4 font-light lg:text-base text-sm uppercase tracking-wide"
          >
            <fieldset
              v-for="(categoriesByQuant, qKey) in categories"
              :key="qKey"
              class="flex flex-col"
            >
              <legend class="text-xs opacity-70 w-full mb-1">
                {{ quantifierLabels[qKey as QuantifierKey] }}
              </legend>

              <template v-for="(items, categoryName) in categoriesByQuant" :key="categoryName">
                <div class="flex items-center flex-wrap">
                  <div
                    class="w-1.5 h-1.5 rounded-sm mr-[var(--app-xs-spacing)]"
                    :class="[categoryColors[categoryName as Categories]]"
                  ></div>

                  <span class="font-semibold mr-[var(--app-xs-spacing)]">{{ categoryName }}:</span>

                  <template v-if="items" v-for="(item, index) in items" :key="index">
                    <span
                      class="whitespace-nowrap"
                      :class="[item.quantifier === Quantifiers.Required ? 'underline' : '']"
                    >
                      {{ item.val }}
                    </span>
                    <span v-if="index < items.length - 1" class="mr-[var(--app-xs-spacing)]">,</span>
                  </template>
                </div>
              </template>
            </fieldset>
          </div>

          <!-- description -->
          <div class="flex flex-col h-full lg:text-base text-xs mt-[var(--app-sm-spacing)]">
            <div class="shrink-0 mb-2 font-light text-muted-foreground" v-if="data?.job_description">Description</div>
            <div class="flex-1 overflow-auto font-light dark:font-light">{{ data?.job_description }}</div>
          </div>

          <!-- highlights -->
          <div class="flex flex-col h-full lg:text-base text-xs mt-[var(--app-sm-spacing)]">
            <div class="shrink-0 mb-2 font-light text-muted-foreground" v-if="highlights">Highlights</div>
            <div class="flex-1 overflow-auto font-light dark:font-light">
              <span v-for="(highlight, section) of data?.job_highlights">
                <div>{{ section }}</div>
                <div v-html="highlight"></div>
              </span>
            </div>
          </div>
  
        </ScrollArea>

        <div class="portrait:row-start-5 row-start-4 col-start-1 col-span-5 row-span-1">

          <div class="w-full flex justify-between py-[var(--app-xs-spacing)]">
            <Button
              variant="ghost"
              size="icon"
              @click="data?.documentId && data?.job_title && emit('interaction', { documentId: data.documentId, jobTitle: data.job_title, flavor: 'dislike' })"               class="m-0 cursor-pointer"
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

        </div>
      </div>
    </div>

</template>