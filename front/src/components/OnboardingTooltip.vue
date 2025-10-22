<script setup lang="ts">
import { computed } from 'vue'
import { useOnboarding } from '@/composables/useOnboarding'

const props = defineProps<{
  stepId: string
}>()

const onboarding = useOnboarding()

const isActive = computed(() => onboarding.isStepActive(props.stepId))
const step = computed(() =>
  onboarding.state.value.steps.find(s => s.id === props.stepId)
)

const isLastStep = computed(() =>
  onboarding.state.value.currentStepIndex ===
  onboarding.state.value.steps.length - 1
)

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
</script>
<template>
  <Popover :open="isActive">
    <PopoverTrigger :class="[isActive ? 'bg-muted/70!' : '']" as-child>
      <slot />
    </PopoverTrigger>
    <PopoverContent class="w-80 border-border">
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold text-lg mb-2">{{ step?.title }}</h3>
          <p class="text-sm text-muted-foreground">{{ step?.content }}</p>
        </div>
        
        <div class="flex items-center justify-between pt-2 border-t">
          <span class="text-xs text-muted-foreground">
            Info {{ onboarding.state.value.currentStepIndex + 1 }} of 
            {{ onboarding.state.value.steps.length }}
          </span>
          
          <div class="flex gap-2">
            <Button
              v-if="onboarding.state.value.currentStepIndex > 0"
              variant="ghost"
              size="sm"
              @click="onboarding.previous()"
            >
              Back
            </Button>
            
            <Button
              v-if="onboarding.state.value.currentStepIndex < onboarding.state.value.steps.length - 1"
              variant="ghost"
              size="sm"
              @click="onboarding.skip()"
            >
              Skip
            </Button>
            
            <Button
              size="sm"
              @click="onboarding.next()"
            >
              {{ isLastStep ? 'Done' : 'Next' }}
            </Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>