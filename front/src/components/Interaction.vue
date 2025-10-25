<script lang="ts" setup>
// props
import { type Interaction, interactionFlavors, flavorIcons, type InteractionFlavor } from '@/stores/interaction'
const props = defineProps<{interaction: Interaction }>()

// interaction
import { ref } from 'vue'
const open = ref(false)
import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const handleInteraction = (flavor: InteractionFlavor) => {
  interactionStore.setInteraction(
    props.interaction.datum.documentId,
    flavor
  )

  open.value = false
}

// misc components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
</script>
<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger class="cursor-pointer" as-child>
      <Button
        variant="outline"
        size="icon"
        class="group [&[data-state=open]]:bg-primary/10"
      >
        <component :is="flavorIcons[props.interaction.flavor]" class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="border-none bg-color-none">
      <ToggleGroup type="single" class="bg-background border-1 border-border">
        <ToggleGroupItem
          v-for="flavor in interactionFlavors"
          :key="flavor"
          :value="flavor"
          class="cursor-pointer"
          @click="handleInteraction(flavor)"
        >
          <component :is="flavorIcons[flavor]" class="w-4 h-4" />
        </ToggleGroupItem>      
      </ToggleGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>