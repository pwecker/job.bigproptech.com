<script setup lang="ts">
// dialog
import { ref } from 'vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
const [UseTemplate, FiltersBody] = createReusableTemplate()
const isOpen = ref(false)

// badges
import { computed } from 'vue'
import { categoryColors, Categories, getTagData } from '@/composables/useTagApi'
const { data, loading, error } = getTagData('grouped')
const badges = computed(() =>
  Object.entries(data.value ?? {}).map(([category, values]) =>
    values.map((value) => ({ category: category as Categories, value }))
  )
);

// components
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tags } from 'lucide-vue-next'
import LoadingElement from '@/components/Loading.vue'
import OnboardingTooltip from './OnboardingTooltip.vue'
</script>
<template>
  <!-- todo: change to "right" controls -->
  <UseTemplate>
    <div v-if="loading"><LoadingElement /></div>
    <div v-else class="flex flex-col gap-4 font-light">
      <div v-for="(group, groupIndex) in badges">
        <fieldset class="border-1 rounded-md p-2 flex flex-wrap gap-1.5">
          <legend class="text-xs flex items-center">
            <div class="w-1.5 h-1.5 rounded-sm mx-0.5 mr-1" :class="[categoryColors[group[0].category as Categories]]"></div>
            {{ group[0].category }}
          </legend>
          <div v-html="data![group[0].category].join(' ')"></div>
        </fieldset>
      </div>
    </div>
  </UseTemplate>

  <Dialog v-model:open="isOpen">
    <OnboardingTooltip step-id="tags">
      <DialogTrigger as-child>
        <Button variant="ghost" class="scale-90 cursor-pointer p-4.5 text-primary" @click="$event.currentTarget.blur()">
          <Tags class="text-primary scale-90" :size="10"/>
        </Button>
      </DialogTrigger>
    </OnboardingTooltip>
    <DialogContent class="sm:max-w-[425px] lg:max-w-[800px] h-[72vh] flex flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>Tags</DialogTitle>
      </DialogHeader>
      <DialogDescription></DialogDescription>
      <ScrollArea class="flex-1 min-h-0">
        <FiltersBody />
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>