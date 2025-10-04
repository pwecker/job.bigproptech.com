<script setup lang="ts">
// dialog
import { ref } from 'vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
const [UseTemplate, FiltersBody] = createReusableTemplate()
const isOpen = ref(false)

// badges
import { computed } from 'vue'
import { Categories, getTagData } from '@/composables/useTagApi'
const { data, loading, error } = getTagData('grouped')
const badges = computed(() =>
  Object.entries(data.value ?? {}).map(([category, values]) =>
    values.map((value) => ({ category: category as Categories, value }))
  )
);

// components
import { ScrollArea } from '@/components/ui/scroll-area'
import CategoryBadges from '@/components/Categories.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SlidersHorizontal } from 'lucide-vue-next'
import LoadingElement from '@/components/Loading.vue'
</script>
<template>
  <UseTemplate>
    <div v-if="loading"><LoadingElement /></div>
    <div v-else class="flex flex-col gap-4">
      <div v-for="(group, groupIndex) in badges">
        <fieldset class="border-1 rounded-md p-2 flex flex-wrap gap-1.5">
          <legend class="text-xs">{{ group[0].category }}</legend>
          <CategoryBadges :params="{value:group}"/>
        </fieldset>
      </div>
    </div>
  </UseTemplate>

  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="ghost" class="cursor-pointer text-primary" size="icon" @click="$event.currentTarget.blur()">
        <SlidersHorizontal class="text-primary scale-90" :size="10"/>
      </Button>
    </DialogTrigger>
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