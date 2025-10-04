import { type Ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { StrapiQueryOptions } from '@/composables/useApi/strapi'
import type { TagDoc } from './useFullApi'

interface SingleData {
  documentId: string
  updatedAt: string
  job_id: string
  job_title: string
  employer_name: string
  employer_logo: string
  employer_website: string
  job_publisher: string
  job_employment_type: string
  job_employment_types: any
  job_apply_is_direct: boolean
  job_apply_link: string
  apply_options: any
  job_description: string
  job_is_remote: boolean
  job_posted_at_datetime_utc: string
  job_location: string
  job_city: string
  job_state: string
  job_country: string
  job_benefits: any
  job_google_link: string
  job_min_salary: number
  job_max_salary: number
  job_salary_period: string
  job_highlights: { [key: string]: string[] },
  tags?: TagDoc[]
}

export interface SingleDataReturn {
  data: Ref<SingleData | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  refetch: () => Promise<SingleData | null>
}

export const DATA_FULL_KEY = '/datas'
const DATA_FULL_QUERY: StrapiQueryOptions = { populate: ['tags'] }


export function getSingleData(documentId: string, authHeaders?: () => Record<string, string>): SingleDataReturn {
  const apiStore = useApi()
  const resource = apiStore.useStrapiResource<SingleData>(
    DATA_FULL_KEY,
    DATA_FULL_QUERY,
    { defaultHeaders: authHeaders }
  )

  return resource.getOne(documentId)
}
