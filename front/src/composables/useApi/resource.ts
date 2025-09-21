import { ref, computed, type ComputedRef, type Ref } from 'vue'
import type { RequestOptions } from '@/composables/useApi/requests'
import { useCacheStore } from '@/stores/api'

export interface Resource<T, Q = any, M = any> {
  data: ComputedRef<T | null>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  refetch: (options?: Q & { headers?: Record<string, string> }) => Promise<T | null>
  meta: ComputedRef<M | null>
}

export interface ResourceFactoryOptions<Q> {
  endpoint: string
  fetcher: (url: string, options?: RequestOptions) => Promise<any>
  buildQuery?: (options?: Q) => string
  responseAdapter: {
    collection: <R>(raw: any) => R[]
    single: <R>(raw: any) => R
  }
  defaultHeaders?: () => Record<string, string>
}

export interface ResourceMethods<TRead, TWrite, Q, M> {
  getAll: (options?: Q & { headers?: Record<string, string> }) => Resource<TRead[], Q, M>
  getOne: (id: string | number, options?: Q & { headers?: Record<string, string> }) => Resource<TRead, Q, M>
  create: (payload: TWrite, options?: any) => Promise<TRead | null>
  update: (id: string | number, payload: TWrite, options?: any) => Promise<TRead | null>
  remove: (id: string | number, options?: any) => Promise<boolean>
}

export function useApiResource<
  TRead = Record<string, any>,
  TWrite = Partial<TRead>,
  Q = Record<string, any>,
  M = any
>({
  endpoint,
  fetcher,
  buildQuery,
  responseAdapter,
  defaultHeaders
}: ResourceFactoryOptions<Q>): ResourceMethods<TRead, TWrite, Q, M> {
  const cache = useCacheStore()

  function getHeaders(providedHeaders?: Record<string, string>): Record<string, string> {
    const defaults = defaultHeaders?.() || {}
    return { ...defaults, ...providedHeaders }
  }

  function makeResource<R>(
    key: string,
    urlBuilder: (opts?: any) => string,
    adapter: (raw: any) => R,
    initialMeta: M | null = null,
    defaultOptions?: any
  ): Resource<R, Q, M> {
    // Create a consistent cache key that includes query options from the start
    const getCacheKeyWithOptions = (options?: any) => 
      cache.getCacheKey(key, { query: buildQuery?.(options) || '' })
    
    // The cache key should be consistent throughout the resource lifecycle
    const cacheKey = getCacheKeyWithOptions(defaultOptions)
    
    // Try to get existing cache entry or create refs
    let cached = cache.get<R>(cacheKey)
    let dataRef: Ref<R | null>
    let loadingRef: Ref<boolean>
    let errorRef: Ref<string | null>
    let metaRef: Ref<M | null>
    
    if (cached) {
      // Use existing refs from cache - cast to expected types
      dataRef = cached.data as Ref<R | null>
      loadingRef = cached.loading
      errorRef = cached.error
      metaRef = (cached.meta as Ref<M | null>) || ref<M | null>(initialMeta)
    } else {
      // Create new refs with explicit typing
      dataRef = ref<R | null>(null) as Ref<R | null>
      loadingRef = ref<boolean>(false)
      errorRef = ref<string | null>(null)
      metaRef = ref<M | null>(initialMeta) as Ref<M | null>
    }

    const execute = async (force = false, options?: any): Promise<R | null> => {
      const queryKey = getCacheKeyWithOptions(options)
      const existingPromise = cache.getPromise<R>(queryKey)

      if (!force && existingPromise) return existingPromise
      
      // Check for existing cached data with this specific query
      const existingCached = cache.get<R>(queryKey)
      if (!force && existingCached && !cache.isStale(queryKey)) {
        // Update our refs to point to the cached data
        dataRef.value = existingCached.data.value
        if (existingCached.meta) metaRef.value = existingCached.meta.value
        return existingCached.data.value
      }

      const request = (async () => {
        try {
          loadingRef.value = true
          errorRef.value = null
          
          const requestHeaders = getHeaders(options?.headers)
          const raw = await fetcher(urlBuilder(options), { headers: requestHeaders })
          const result = adapter(raw)

          if ('meta' in raw) metaRef.value = (raw as { meta?: M }).meta ?? null

          // Store in cache with the query-specific key
          cache.set(queryKey, result)
          
          // Update our local refs
          dataRef.value = result
          errorRef.value = null
          return result
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          errorRef.value = msg
          cache.setError(queryKey, msg)
          return null
        } finally {
          loadingRef.value = false
          cache.clearPromise(queryKey)
        }
      })()

      cache.setPromise<R>(queryKey, request)
      return request
    }

    // Check if we should execute initially
    if (!cached || cache.isStale(cacheKey)) {
      void execute(false, defaultOptions)
    }

    return {
      data: computed(() => dataRef.value),
      meta: computed(() => metaRef.value),
      loading: computed(() => loadingRef.value),
      error: computed(() => errorRef.value),
      refetch: (opts) => execute(true, opts),
    }
  }

  async function mutate<R = any>({
    url,
    method,
    body,
    adapter,
    invalidateKeys = []
  }: {
    url: string
    method: 'POST' | 'PUT' | 'DELETE'
    body?: any
    adapter?: (raw: any) => R
    invalidateKeys?: string[]
  }): Promise<R | boolean | null> {
    try {
      const raw = await fetcher(url, {
        method,
        body: body ? { data: body } : undefined,
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
      })
      const result = adapter ? adapter(raw) : true
      invalidateKeys.forEach((k) => cache.invalidate(k))
      return result
    } catch (err) {
      console.error(`${method} failed for ${url}`, err)
      return method === 'DELETE' ? false : null
    }
  }

  function getAll(options?: Q & { headers?: Record<string, string> }) {
    const urlBuilder = (opts?: any) => {
      const query = buildQuery?.(opts)
      return query ? `${endpoint}?${query}` : endpoint
    }

    return makeResource<TRead[]>(`${endpoint}/all`, urlBuilder, responseAdapter.collection, null, options)
  }

  function getOne(id: string | number, options?: Q & { headers?: Record<string, string> }) {
    const urlBuilder = (opts?: any) => {
      const query = buildQuery?.(opts)
      return query ? `${endpoint}/${id}?${query}` : `${endpoint}/${id}`
    }

    return makeResource<TRead>(`${endpoint}/${id}`, urlBuilder, responseAdapter.single, null, options)
  }

  async function create(payload: TWrite, options?: any) {
    const queryString = buildQuery ? buildQuery(options as Q) : ''
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return (await mutate<TRead>({
      url,
      method: 'POST',
      body: payload,
      adapter: responseAdapter.single,
      invalidateKeys: [endpoint],
    })) as TRead | null
  }

  async function update(id: string | number, payload: TWrite, options?: any) {
    const queryString = buildQuery ? buildQuery(options as Q) : ''
    const url = queryString ? `${endpoint}/${id}?${queryString}` : `${endpoint}/${id}`
    return (await mutate<TRead>({
      url,
      method: 'PUT',
      body: payload,
      adapter: responseAdapter.single,
      invalidateKeys: [endpoint, `${endpoint}/${id}`],
    })) as TRead | null
  }

  async function remove(id: string | number, options?: any) {
    const url = `${endpoint}/${id}`
    return (await mutate<boolean>({
      url,
      method: 'DELETE',
      invalidateKeys: [endpoint, `${endpoint}/${id}`],
    })) as boolean
  }

  return { getAll, getOne, create, update, remove }
}