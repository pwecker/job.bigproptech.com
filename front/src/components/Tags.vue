<script setup lang="ts">
// state
import { useUXStore } from '@/stores/ux'
import { storeToRefs } from 'pinia'
const uxStore = useUXStore()
const { drawerOpen } = storeToRefs(uxStore)

// data
import { categoryColors, Categories, getTagData } from '@/composables/useTagApi'
const { data, loading, error } = getTagData('grouped')

// components
import { ScrollArea } from '@/components/ui/scroll-area'
</script>
<template>
  
  <div :class="{'collapsed': !drawerOpen}" class="tags-sidebar absolute right-0 z-1 md:relative max-h-[calc(100vh-1px-var(--app-header-height))] text-sm text-muted-foreground w-[var(--sidebar-width)] h-full bg-sidebar border-l-1 border-border">
    <ScrollArea class="h-full flex flex-col gap-[var(--app-sm-spacing)] overflow-y-auto pt-[var(--app-xs-spacing)]">
      <template v-for="(category, name) in data">
        <fieldset class="border-1 border-muted p-[var(--app-sm-spacing)] mt-[var(--app-xs-spacing)] m-[var(--app-sm-spacing)] mr-[var(--app-sm-spacing)]">
          <legend class="text-xs px-[var(--app-sm-spacing)] text-primary">{{ name }}</legend>
          {{ category.join(', ') }}
        </fieldset>
      </template>
    </ScrollArea>
  </div>
  <Transition name="fade" mode="out-in">
    <div v-if="drawerOpen" @click="uxStore.toggleDrawer()" class="visible md:invisible absolute inset-0 z-0 bg-black/80"></div>
  </Transition>

</template>
<style scoped>
/* just fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tags-sidebar {
  transition: width 0.5s ease, transform 0.5s ease;
  overflow: hidden;
}
.tags-sidebar.collapsed {
  width: 0;
  transform: translateX(100%);
}
</style>