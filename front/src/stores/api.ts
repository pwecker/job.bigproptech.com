import { defineStore } from 'pinia'
import { ref, type Ref, shallowRef } from 'vue'

export interface CacheEntry<T = any> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  timestamp: number
  promise?: Promise<T | null>
  meta?: Ref<any>
}

export interface CacheOptions {
  ttl?: number
}

export interface CacheStore {
  cache: Ref<Map<string, CacheEntry<any>>>
  getCacheKey: (endpoint: string, params?: Record<string, any>) => string
  get: <T>(key: string) => CacheEntry<T> | undefined
  set: <T>(key: string, data: T | null, options?: CacheOptions) => void
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string) => void
  isStale: (key: string, ttl?: number) => boolean
  invalidate: (pattern?: string) => void
  getPromise: <T>(key: string) => Promise<T | null> | undefined
  setPromise: <T>(key: string, promise: Promise<T | null>) => void
  clearPromise: (key: string) => void
}

export const useCacheStore = defineStore('api', (): CacheStore => {
  const cacheMap = new Map<string, CacheEntry<any>>()
  const cache = shallowRef(cacheMap)

  function getCacheKey(endpoint: string, params?: Record<string, any>): string {
    return params ? `${endpoint}${ params.query ? '?' + decodeURI(params.query) : '' }` : endpoint
  }

  function createCacheEntry<T>(): CacheEntry<T> {
    return {
      data: ref<T | null>(null) as Ref<T | null>,
      loading: ref(false),
      error: ref<string | null>(null),
      timestamp: Date.now(),
    }
  }

  function ensureEntry<T>(key: string): CacheEntry<T> {
    let entry = cacheMap.get(key) as CacheEntry<T> | undefined
    if (!entry) {
      entry = createCacheEntry<T>()
      cacheMap.set(key, entry)
      cache.value = new Map(cacheMap)
    }

    return entry
  }

  function set<T>(key: string, data: T | null, options: CacheOptions = {}): void {
    const entry = ensureEntry<T>(key)
    entry.data.value = data
    entry.timestamp = Date.now()
    entry.loading.value = false
    entry.error.value = null
  }

  function get<T>(key: string): CacheEntry<T> | undefined {
    return cacheMap.get(key) as CacheEntry<T> | undefined
  }

  function setPromise<T>(key: string, promise: Promise<T | null>): void {
    const entry = ensureEntry<T>(key)
    entry.promise = promise
    entry.loading.value = true
  }

  function getPromise<T>(key: string): Promise<T | null> | undefined {
    const entry = cacheMap.get(key)
    return entry?.promise as Promise<T | null> | undefined
  }

  function clearPromise(key: string): void {
    const entry = cacheMap.get(key)
    if (entry) {
      delete entry.promise
    }
  }

  function setLoading(key: string, loading: boolean): void {
    const entry = ensureEntry(key)
    entry.loading.value = loading
  }

  function setError(key: string, error: string): void {
    const entry = ensureEntry(key)
    entry.error.value = error
    entry.loading.value = false
  }

  function isStale(key: string, ttl: number = 300000): boolean {
    const entry = cacheMap.get(key)
    if (!entry) return true
    return Date.now() - entry.timestamp > ttl
  }

  function invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of cacheMap.keys()) {
        if (key.includes(pattern)) {
          cacheMap.delete(key)
        }
      }
    } else {
      cacheMap.clear()
    }

    cache.value = new Map(cacheMap)
  }

  return {
    cache,
    getCacheKey,
    get,
    set,
    setLoading,
    setError,
    isStale,
    invalidate,
    setPromise,
    getPromise,
    clearPromise,
  }
})