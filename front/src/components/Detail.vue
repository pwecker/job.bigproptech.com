<script setup lang="ts">

interface Props {
  documentId: string
}

// shared resource
const props = defineProps<Props>()
import { getSingleData } from '@/composables/useDetailApi'
const { data, loading, error } = getSingleData(props.documentId)

// error watching
import { useRouter } from 'vue-router'
import { watch } from 'vue'
const router = useRouter()

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      router.push({ path: '/' })
    }, 750)
  }
}, { immediate: true })

// formatting
import { ref, computed } from "vue"
const salaryDisplay = computed(() => {
  if (!data.value) return ""
  const min = data.value.job_min_salary?.toLocaleString() || ""
  const max = data.value.job_max_salary?.toLocaleString() || ""
  return min && max
    ? `$${min} - $${max} / ${data.value.job_salary_period}`
    : min
      ? `$${min} / ${data.value.job_salary_period}`
      : "Not specified"
})

const showFullDescription = ref(false)

const truncatedDescription = computed(() => {
  if (!data.value) return ""
  const desc = data.value.job_description || ""
  if (desc.length <= 500 || showFullDescription.value) return desc
  return desc.slice(0, 500) + "..."
})

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Globe, DollarSign, CheckCircle2 } from 'lucide-vue-next'
</script>

<template>
  <div class="w-full h-full flex items-start justify-center">
    <div v-if="loading"></div>
    <div v-else-if="error" class="w-full h-full flex justify-center items-center">
      <Card @click.stop="" class="w-full max-w-4xl shadow-lg rounded-2xl flex">
        <CardHeader class="flex flex-row items-center justify-center gap-4">
          Error: {{ error }}
        </CardHeader>
      </Card>
    </div>
    <Card @click.stop="" v-else-if="data" class="w-full max-w-4xl shadow-lg rounded-2xl">
      <!-- header -->
      <CardHeader class="flex flex-row items-center gap-4">
        <img
          v-if="data.employer_logo"
          :src="data.employer_logo"
          alt="logo"
          class="w-16 h-16 object-contain rounded-lg border"
        />
        <div>
          <CardTitle class="text-2xl font-bold leading-11">{{ data.job_title }}</CardTitle>
          <CardDescription>
            {{ data.employer_name }}
            <span v-if="data.job_employment_type" class="ml-2">
              <Badge variant="secondary">{{ data.job_employment_type }}</Badge>
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <!-- content -->
      <CardContent class="space-y-4">
        <!-- location and info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <MapPin class="w-4 h-4" />
            <span>{{ data.job_city }}, {{ data.job_state }}, {{ data.job_country }}</span>
            <Badge v-if="data.job_is_remote" class="ml-2" variant="outline">Remote</Badge>
          </div>
          <div class="flex items-center gap-2">
            <CalendarDays class="w-4 h-4" />
            <span>Posted: {{ new Date(data.job_posted_at_datetime_utc).toLocaleDateString() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <DollarSign class="w-4 h-4" />
            <span>{{ salaryDisplay }}</span>
          </div>
          <div v-if="data.employer_website" class="flex items-center gap-2">
            <Globe class="w-4 h-4" />
            <a :href="data.employer_website" target="_blank" class="underline">
              Company Website
            </a>
          </div>
        </div>

        <!-- description -->
        <div>
          <h3 class="text-lg font-semibold mb-2">Job Description</h3>
          <p class="text-sm leading-relaxed whitespace-pre-line">{{ truncatedDescription }}</p>
          <button
            v-if="data.job_description && data.job_description.length > 500"
            class="text-blue-600 hover:underline mt-2 text-sm"
            @click="showFullDescription = !showFullDescription"
          >
            {{ showFullDescription ? "Show less" : "Read more" }}
          </button>
        </div>

        <!-- highlights -->
        <div v-if="data.job_highlights">
          <h3 class="text-lg font-semibold mb-2">Highlights</h3>
          <ul class="list-none space-y-1">
            <li v-for="(items, key) in data.job_highlights" :key="key">
              <span class="font-medium capitalize">{{ key }}:</span>
              <ul class="ml-4 mt-1 space-y-1">
                <li v-for="item in items" :key="item" class="flex items-center gap-2">
                  <CheckCircle2 class="w-4 h-4 text-green-600" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </CardContent>

      <!-- footer -->
      <CardFooter class="flex justify-between items-center">
        <span class="text-sm text-muted-foreground">Published by {{ data.job_publisher }}</span>
        <Button as="a" :href="data.job_apply_link" target="_blank" size="lg">
          Apply Now
        </Button>
      </CardFooter>
    </Card>

    <div v-else>No data found</div>
  </div>
</template>
