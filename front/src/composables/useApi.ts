import { useApiRequests } from '@/composables/useApi/requests'
import { useApiResource } from '@/composables/useApi/resource'
import { buildStrapiQuery, type StrapiQueryOptions } from '@/composables/useApi/strapi'
import { plainAdapter, strapiAdapter } from '@/composables/useApi/adapters'
import { useCacheStore } from '@/stores/api'

export function useApi() {
  const { request } = useApiRequests()
  const cache = useCacheStore()

  function useResource<TRead, TWrite = Partial<TRead>>(
    endpoint: string,
    options?: { defaultHeaders?: () => Record<string, string> }
  ) {
    return useApiResource<TRead, TWrite>({
      endpoint,
      fetcher: (url, opts) => request(url, opts),
      responseAdapter: plainAdapter,
      defaultHeaders: options?.defaultHeaders,
    })
  }

  function useStrapiResource<TRead, TWrite = Partial<TRead>>(
    endpoint: string,
    baseOptions?: StrapiQueryOptions,
    options?: { defaultHeaders?: () => Record<string, string> }
  ) {
    return useApiResource<TRead, TWrite, StrapiQueryOptions, any>({
      endpoint,
      fetcher: (url, opts) => request(url, opts),
      buildQuery: (opts?: StrapiQueryOptions) =>
        buildStrapiQuery({ ...baseOptions, ...opts }),
      responseAdapter: strapiAdapter,
      defaultHeaders: options?.defaultHeaders,
    })
  }

  return { useResource, useStrapiResource, invalidateCache: cache.invalidate }
}
