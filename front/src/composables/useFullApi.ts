import { type ComputedRef, type Ref, ref } from 'vue'
import { useApi } from '@/composables/useApi'
import type { StrapiQueryOptions } from '@/composables/useApi/strapi'
import type { StrapiMeta } from './useApi/requests'
import { watchOnce } from "@vueuse/core"
import { Categories } from '@/composables/useTagApi'

export interface Tag {
  category: Categories
  value: string
  quantifier?: string
}

export interface Segment {
  name: string
}

export interface ListData {
  updatedAt: string
  documentId: string
  job_id: string
  job_title: string
  job_max_salary: number
  job_location: string
  employer_name: string
  job_posted_at_datetime_utc: string | null
  job_is_remote: boolean
  job_description: string
  tags?: Tag[],
  segments?: Segment
}

export interface ListDataReturn {
  data: Ref<ListData[] | null>
  meta: ComputedRef<StrapiMeta | null>,
  loading: Ref<boolean>
  error: Ref<string | null>
  refetch: (options?: { headers?: Record<string, string> }) => Promise<ListData[] | null>
  nextPage: () => Promise<boolean>
  fetchPage: (page: number) => Promise<void>
  getIndexById: (id: string) => number
  getRelativeId: (id: string, offset: number) => string | null
}

export const LIST_PAGE_SIZE: 20 | 50 | 100 = 50
export const LIST_DATA_KEY = '/datas'
const LIST_DATA_OPTIONS: StrapiQueryOptions = {
  fields: [
    'updatedAt',
    'job_id',
    'job_title',
    'job_min_salary',
    'job_max_salary',
    'job_posted_at_datetime_utc',
    'job_location',
    'employer_name',
    'job_is_remote',
    'job_description'
  ],
  pagination: { page: 1, pageSize: LIST_PAGE_SIZE },
  filters: {
    tags: { $notNull: true },
    job_posted_at_datetime_utc: { $notNull: true }
  },
  sort: ['job_posted_at_datetime_utc:desc'],
  populate: {
    tags: {
      fields: ['category', 'value', 'quantifier']
    }
  }
}

let singleton: ListDataReturn | null = import.meta.hot ? (import.meta.hot.data.listDataSingleton ?? null) : null
export function listData(authHeaders?: () => Record<string, string>): ListDataReturn {
  if (singleton) {
    return singleton
  }

  const apiStore = useApi()
  const resource = apiStore.useStrapiResource<ListData>(
    LIST_DATA_KEY,
    LIST_DATA_OPTIONS,
    { defaultHeaders: authHeaders }
  )

  const { data, meta, loading, error, refetch } = resource.getAll(LIST_DATA_OPTIONS)
  const mergedData = ref<ListData[] | null>(null)

  watchOnce(data, (val) => {
    if (val) {
      const total = meta.value?.pagination?.total ?? LIST_PAGE_SIZE
      mergedData.value = new Array(total)

      val.forEach((row, i) => {
        mergedData.value![i] = row
      })
    }
  })

  async function fetchPage(page: number) {
    const startIndex = (page - 1) * LIST_PAGE_SIZE
    const endIndex = startIndex + LIST_PAGE_SIZE
    let needsFetch = !mergedData.value
    const slice = mergedData.value?.slice(startIndex, endIndex).filter(row => row) || []
    needsFetch = slice.length < endIndex - startIndex
    
    if (!needsFetch || meta.value?.pagination?.total && (slice.length + startIndex >= meta.value?.pagination?.total)) {
      return
    }

    const res = await refetch({ ...LIST_DATA_OPTIONS, pagination: { page, pageSize: LIST_PAGE_SIZE } })
    if (res) {
      if (!mergedData.value) {
        const total = meta.value?.pagination?.total ?? page * LIST_PAGE_SIZE
        mergedData.value = new Array(total)
      }

      res.forEach((row, i) => {
        mergedData.value![startIndex + i] = row
      })
    }
  }

  async function nextPage() {
    if (!meta.value) return false
    const { page, pageCount } = meta.value.pagination
    const more = page < pageCount
    if (more) await fetchPage(page + 1)
    return more
  }

  function getIndexById(id: string) {
    return mergedData.value?.findIndex(d => d && d.documentId === id) ?? -1
  }

  function getRelativeId(id: string, offset: number) {
    if (!mergedData.value?.length) return null
    const index = getIndexById(id)
    const safeIndex = index === -1 ? 0 : index
    const total = mergedData.value.length
    const targetIndex = (safeIndex + offset + total) % total
    return mergedData.value[targetIndex].documentId
  }

  singleton = {
    data: mergedData,
    meta,
    loading,
    error,
    refetch,
    nextPage,
    fetchPage,
    getIndexById,
    getRelativeId
  }

  if (import.meta.hot) {
    import.meta.hot.data.listDataSingleton = singleton
  }

  return singleton
}
