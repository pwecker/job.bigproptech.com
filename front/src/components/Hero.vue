<script setup lang="ts">
defineProps<{ offset: number }>()

import { useUXStore } from '@/stores/ux'
const ux = useUXStore()
</script>
<template>

  <!-- dark mode -->
  <div class="w-full h-[calc(1*100vh)] relative pointer-events-none dark:overflow-hidden text-primary">
    <div v-if="ux.isDark" class="dark-shape-one w-[calc(100vw*1)] h-full bg-ring/5 top-0 left-[50%] -translate-x-[50%] absolute z-2"
      :style="{top:`calc(${(offset / 1.5) * 0.69}px`}"
    ></div>

    <div v-if="ux.isDark" class="dark-shape-two w-[calc(100vw*1)] h-full bg-indigo-950/50 top-0 left-[50%] -translate-x-[50%] absolute z-1 mix-blend-multiply"
      :style="{top:`calc(${(offset / 1.5) * 0.75}px`}"
    ></div>

    <div v-if="ux.isDark" class="radial-gradient absolute -right-[200px] w-200 h-322 rounded-full opacity-10"
      style="--gradient-x: 50%; --gradient-y: 50%; --color-start: oklch(44.6% 0.043 257.281/10); --color-middle: oklch(27.7% 0.046 192.524/0); --color-end: transparent;"
      :style="{top:`calc(${(offset / 1.5) * 0.75}px`}"
    >
    </div>

    <!-- light mode -->
    <div v-if="!ux.isDark" class="linear-grid absolute inset-0 z-1 opacity-60 mix-blend-overlay"></div>
    <div v-if="!ux.isDark" class="radial-gradient absolute -top-[600px] -right-[200px] w-200 h-322 rounded-full opacity-20"
      style="--gradient-x: 50%; --gradient-y: 50%; --color-start: oklch(85.5% 0.138 181.071); --color-middle: oklch(27.7% 0.046 192.524/0); --color-end: transparent;">
    </div>

    <div v-if="!ux.isDark" class="radial-gradient absolute -top-[50px] -right-[200px] w-100 h-162 rounded-full opacity-15"
      style="--gradient-x: 50%; --gradient-y: 50%; --color-start: oklch(87.9% 0.169 91.605); --color-middle: oklch(41.4% 0.112 45.904/0); --color-end: transparent;">
    </div>

    <div v-if="!ux.isDark" class="radial-gradient absolute -top-[400px] -left-[200px] w-200 h-322 rounded-full opacity-17"
      style="--gradient-x: 50%; --gradient-y: 50%; --color-start: oklch(71.2% 0.194 13.428); --color-middle: oklch(27.7% 0.046 192.524/0); --color-end: transparent;">
    </div>

    <div v-if="!ux.isDark" class="radial-gradient absolute -bottom-[250px] left-[50px] w-162 h-100 rounded-full opacity-29"
      style="--gradient-x: 50%; --gradient-y: 50%; --color-start: oklch(91.7% 0.08 205.041); --color-middle: oklch(41.4% 0.112 45.904/0); --color-end: transparent;">
    </div>

    <div class="absolute inset-0 flex flex-col items-center justify-center z-3 gap-3">

      <!-- todo: tailwind child iterations -->
      <section class="text-center">
        <p class="lg:text-7xl text-5xl tracking-[0.015em] font-[instrumentSerif]">Tinder UI/UX</p>
        <p class="lg:text-xl text-lg font-thin tracking-wide">Novel Data Strolling</p>
      </section>

      <section class="text-center">
        <p class="lg:text-7xl text-5xl tracking-[0.015em] font-[instrumentSerif]">Multiple Data Source</p>
        <p class="lg:text-xl text-lg font-thin tracking-wide">Inferential Normalization</p>
      </section>

      <section class="text-center">
        <p class="lg:text-7xl text-5xl tracking-[0.015em] font-[instrumentSerif]">Fast Data Sync</p>
        <p class="lg:text-xl text-lg font-thin tracking-wide">Highly Concurrent Context Cycling</p>
      </section>

    </div>

  </div>
</template>
<style scoped>
.linear-grid {
  background-size: var(--app-md-spacing) var(--app-md-spacing);
  background-image:
  linear-gradient(to right, var(--muted) 1px, transparent 1px),
  linear-gradient(to bottom, var(--muted) 1px, transparent 1px);
}

.dark-shape-one { clip-path: path('M239.018 -1C-43.6588 66.6334 -141.61 365.38 1728 1019.3V1117H0V-1H239.018Z');}
.dark-shape-two { clip-path: path('M1728 1117V579.696C1103.2 541.71 312.46 421.689 3.32779 157.973V1117H1728Z'); }

.light-shape-one { clip-path: ellipse(130px 130px at 10% 20%); }

.light-position-one {
  background-size:100px 100px;
}
.light-position-two {
  left: 20%;
  top: -40%;
}
.light-color-one {
  background: #2A7B9B;
  background: radial-gradient(circle,rgba(42, 123, 155, 0.9) 0%, rgba(87, 199, 133, 0) 50%, rgba(255, 255, 255, 0) 100%);
}

.radial-gradient {
  background: radial-gradient(
    circle at var(--gradient-x, 500%) var(--gradient-y, 50%),
    var(--color-start) 20%,
    var(--color-middle) 50%,
    var(--color-end) 100%
  );
}
</style>