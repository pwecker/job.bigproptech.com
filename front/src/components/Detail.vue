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
import { type TagDoc } from '@/composables/useFullApi'
import { Categories, type CategorySet, categoryColors } from '@/composables/useTagApi'
const categories = computed(() => {
  if (data.value === null) return null
  const tags: TagDoc[] | undefined = data.value.tags
  if (!tags) return null

  return tags.reduce((acc: any, current: any) => {
    const { category, value: val, quantifier } = current
    acc[category] = acc[category] || []
    acc[category].push({val, quantifier})
    return acc
  }, {})
});

// interaction
import { type InteractionFlavor } from '@/stores/interaction'
const emit = defineEmits<{ (e: 'interaction', payload: { documentId: string, jobTitle: string, flavor: InteractionFlavor }): void }>();

// components
import { CircleX, CircleCheck, X } from 'lucide-vue-next'
import Loading from './Loading.vue'
import { Button } from './ui/button'
</script>
<template>

    <div @click.stop="" class="p-[var(--app-md-spacing)] pb-0 relative w-full h-full border-accent border-1 transition-[width] flex flex-col justify-between bg-popover shadow-lg">
      
      <!-- close -->
      <X :size="30" @click="router.push('/')" class="rounded-sm transition-colors cursor-pointer p-[var(--app-xs-spacing)] absolute top-[var(--app-xs-spacing)] right-[var(--app-xs-spacing)] text-primary hover:text-primary hover:bg-primary-foreground"/>
      
      <!-- <div v-if="true">
        {{ categories }}
      </div> -->
      <Loading v-if="loading" />
      <div v-else-if="documentId" class="portrait:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] grid grid-cols-5 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-y-[var(--app-sm-spacing)] w-full h-full">
        <div class="row-start-1 col-start-1 col-span-4 row-span-1">

          <!-- age, type -->
          <div class="font-light lg:text-base text-xs flex gap-[var(--app-xs-spacing)] -ml-0.5"><span>[ {{ age }} ]</span><span>{{ data?.job_employment_type }}</span></div>
          <!-- title -->
          <div class="font-light">{{ data?.job_title }}</div>
          <!-- company, location -->
          <div class="flex items-center font-light lg:text-base text-xs">
            <span>{{ data?.employer_name }}</span>
            <div class="w-[3px] h-[3px] rounded-sm mx-0.5 bg-primary"></div>
            <span>{{ data?.job_location }}</span>
          </div>

        </div>
        <div class="portrait:col-span-5 row-start-2 col-start-1 col-span-4 row-span-1">
  
          <!-- categories -->
          <div class="grow flex flex-wrap gap-x-2 font-light lg:text-base text-sm dark:font-light uppercase tracking-wide">
            <span class="flex items-center overflow-auto" v-for="(group, name) in categories as CategorySet">
              <div class="w-1.5 h-1.5 rounded-sm mx-0.5 mr-1" :class="[categoryColors[name as Categories]]"></div>
              <template v-for="(item, index) in group" :key="index">
                <div
                  class="tracking-wide whitespace-nowrap"
                  :class="[
                    item.quantifier === 'required' ? 'underline' : ''
                  ]"
                >{{ item.val }}
                </div><span v-if="index < (group.length ?? 0) - 1" class="mr-0.5">,</span>
              </template>
            </span>
          </div>

        </div>
        <div class="portrait:row-start-3 portrait:col-start-1 portrait:row-span-1 portrait:col-span-5 row-start-1 col-start-5 row-span-3">

          <!-- apply options -->
          <div class="pt-[var(--app-xs-spacing)] portrait:p-0 flex portrait:flex-row overflow-x-auto flex-col leading-[1.125em]">
            <div v-for="option in data?.apply_options" class="font-light">
              <a @click.stop="" class="w-full lg:text-sm text-xs whitespace-nowrap hover:underline" :href="option.apply_link" >[ {{ option.publisher }} ]</a>
            </div>
          </div>

        </div>
        <div class="portrait:row-start-4 row-start-3 col-start-1 col-span-3 row-span-1">

          <!-- description -->
          <div class=" pr-4 flex flex-col h-full lg:text-base text-xs">
            <div class="shrink-0 mb-2 font-light text-muted-foreground" v-if="data?.job_description">Description</div>
            <div class="flex-1 overflow-auto font-light dark:font-light">{{ data?.job_description }}</div>
          </div>

        </div>
        <div class="portrait:row-start-4 row-start-3 col-start-4 col-span-2 row-span-1">

          <!-- highlights -->
          <div class=" pr-4 flex flex-col h-full lg:text-base text-xs">
            <div class="shrink-0 mb-2 font-light text-muted-foreground" v-if="highlights">Highlights</div>
            <div class="flex-1 overflow-auto font-light dark:font-light">
              <span v-for="(highlight, section) of data?.job_highlights">
                <div>{{ section }}</div>
                <div v-html="highlight"></div>
              </span>
            </div>
          </div>

        </div>
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