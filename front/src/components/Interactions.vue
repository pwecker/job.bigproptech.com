<script setup lang="ts">

import { computed } from 'vue'
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()

const all = computed(() => interactionStore.allInteractions)
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

  <!-- todo: order by recency -->
  <!-- all -->
  <slot
    v-if="all.length > 0"
    name="recent"
    :items="all"
    :title="'Recent'"
  />

</template>