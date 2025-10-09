<script setup lang="ts">

import { ref } from 'vue'
import type { IHeaderParams } from 'ag-grid-community'
import { type LucideIcon } from 'lucide-vue-next'
type CustomHeaderParams = IHeaderParams & { icon: LucideIcon }
const props = defineProps<{ params: CustomHeaderParams }>()
const icon = ref(props.params.icon)

</script>
<template>
  <div class="h-full flex items-center">
    <component :is="icon" class="w-4 h-4" />
  </div>
</template>