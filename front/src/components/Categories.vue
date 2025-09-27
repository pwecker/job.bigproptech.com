<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps<{ params: { value: CategoryBadge[] } }>()
const categoryBadges = ref(props.params.value)

import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { toggleCategory, isActiveCategory } = uxStore
import { type CategoryBadge, Categories } from '@/composables/useTagApi'

const categoryColors: Record<
  Categories,
  {
    inactive: { bg: string; border: string }
    active: { bg: string; border: string }
  }
> = {
  [Categories.ProgrammingLanguage]: {
    inactive: {
      bg: "bg-stone-100 dark:bg-stone-800",
      border: "border-stone-400/50 dark:border-stone-200/40",
    },
    active: {
      bg: "bg-stone-500 text-stone-50 dark:bg-stone-200 dark:text-stone-950",
      border: "border-stone-700 dark:border-stone-300",
    },
  },

  [Categories.Framework]: {
    inactive: {
      bg: "bg-amber-400/20 dark:bg-amber-500/20",
      border: "border-amber-400/50 dark:border-amber-300/50",
    },
    active: {
      bg: "bg-amber-400/40 dark:bg-amber-400/70",
      border: "border-amber-300 dark:border-amber-400",
    },
  },

  [Categories.CloudPlatform]: {
    inactive: {
      bg: "bg-sky-400/20 dark:bg-sky-500/20",
      border: "border-sky-400/50 dark:border-sky-300/50",
    },
    active: {
      bg: "bg-sky-400/40 dark:bg-sky-400/70",
      border: "border-sky-300 dark:border-sky-700",
    },
  },

  [Categories.Database]: {
    inactive: {
      bg: "bg-green-400/20 dark:bg-green-500/20",
      border: "border-green-400/50 dark:border-green-300/50",
    },
    active: {
      bg: "bg-green-400/40 dark:bg-green-400/70",
      border: "border-green-300 dark:border-green-700",
    },
  },

  [Categories.DevopsTool]: {
    inactive: {
      bg: "bg-violet-400/20 dark:bg-violet-500/20",
      border: "border-violet-400/50 dark:border-violet-300/50",
    },
    active: {
      bg: "bg-violet-400/40 dark:bg-violet-400/70",
      border: "border-violet-300 dark:border-violet-700",
    },
  },

  [Categories.Testing]: {
    inactive: {
      bg: "bg-purple-400/20 dark:bg-purple-500/20",
      border: "border-purple-400/50 dark:border-purple-300/50",
    },
    active: {
      bg: "bg-purple-400/40 dark:bg-purple-400/70",
      border: "border-purple-300 dark:border-purple-700",
    },
  },

  [Categories.SecurityClearance]: {
    inactive: {
      bg: "bg-slate-400/20 dark:bg-slate-500/20",
      border: "border-slate-400/50 dark:border-slate-300/50",
    },
    active: {
      bg: "bg-slate-400/40 dark:bg-slate-400/70",
      border: "border-slate-300 dark:border-slate-700",
    },
  },

  [Categories.EducationLevel]: {
    inactive: {
      bg: "bg-red-400/20 dark:bg-red-500/20",
      border: "border-red-400/50 dark:border-red-300/50",
    },
    active: {
      bg: "bg-red-400/40 dark:bg-red-400/70",
      border: "border-red-300 dark:border-red-700",
    },
  },

  [Categories.DegreeField]: {
    inactive: {
      bg: "bg-pink-400/20 dark:bg-pink-500/20",
      border: "border-pink-400/50 dark:border-pink-300/50",
    },
    active: {
      bg: "bg-pink-400/40 dark:bg-pink-400/70",
      border: "border-pink-300 dark:border-pink-700",
    },
  },

  [Categories.Compensation]: {
    inactive: {
      bg: "bg-lime-400/20 dark:bg-lime-500/20",
      border: "border-lime-400/50 dark:border-lime-300/50",
    },
    active: {
      bg: "bg-lime-400/40 dark:bg-lime-400/70",
      border: "border-lime-300 dark:border-lime-700",
    },
  },

  [Categories.Benefits]: {
    inactive: {
      bg: "bg-teal-400/20 dark:bg-teal-500/20",
      border: "border-teal-400/50 dark:border-teal-300/50",
    },
    active: {
      bg: "bg-teal-400/40 dark:bg-teal-400/70",
      border: "border-teal-300 dark:border-teal-700",
    },
  },

  [Categories.WorkArrangement]: {
    inactive: {
      bg: "bg-indigo-400/20 dark:bg-indigo-500/20",
      border: "border-indigo-400/50 dark:border-indigo-300/50",
    },
    active: {
      bg: "bg-indigo-400/40 dark:bg-indigo-400/70",
      border: "border-indigo-300 dark:border-indigo-700",
    },
  },

  [Categories.EmploymentType]: {
    inactive: {
      bg: "bg-indigo-400/20 dark:bg-indigo-500/20",
      border: "border-indigo-400/50 dark:border-indigo-300/50",
    },
    active: {
      bg: "bg-indigo-400/40 dark:bg-indigo-400/70",
      border: "border-indigo-300 dark:border-indigo-700",
    },
  },

  [Categories.PerksCulture]: {
    inactive: {
      bg: "bg-indigo-400/20 dark:bg-indigo-500/20",
      border: "border-indigo-400/50 dark:border-indigo-300/50",
    },
    active: {
      bg: "bg-indigo-400/40 dark:bg-indigo-400/70",
      border: "border-indigo-300 dark:border-indigo-700",
    },
  },
}

// components
import { Badge } from '@/components/ui/badge'

import { computed } from 'vue';
const groupedCategoryBadges = computed(() => {
  const active = categoryBadges.value.filter(b => isActiveCategory(b))
  const inactive = categoryBadges.value.filter(b => !isActiveCategory(b))
  return [...active, ...inactive]
})

</script>
<template>
  <div>
    <Badge
      v-for="badge in groupedCategoryBadges"
      :key="`${badge.category}:${badge.value}`"
      :class="isActiveCategory(badge)
        ? [categoryColors[badge.category].active.bg, categoryColors[badge.category].active.border]
        : [categoryColors[badge.category].inactive.bg, categoryColors[badge.category].inactive.border]
      "
      class="mr-2 mb-2 cursor-pointer"
      @click.stop="toggleCategory(badge)"
      variant="outline"
    >
      {{ badge.value }}
    </Badge>
  </div>
</template>