<script setup lang="ts">

import { computed } from 'vue'
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()

const recent = computed(() => 
  interactionStore.allInteractions.sort((a, b) => {
    const timeA = a.updatedAt || a.createdAt
    const timeB = b.updatedAt || b.createdAt
    if (timeA && timeB) {
      if (timeB < timeA) {
        return -1;
      }
      if (timeB > timeA) {
        return 1;
      }
    }

    return 0;
  })
)
const likes = computed(() =>
  interactionStore.allInteractions.filter(i => i.flavor === 'like')
)

</script>
<template>
  <!-- likes -->
  <slot
    v-if="likes.length > 0"
    name="liked"
    :items="likes"
    :title="'Liked'"
  />

  <!-- recent -->
  <slot
    v-if="recent.length > 0"
    name="recent"
    :items="recent"
    :title="'Recent'"
  />

</template>