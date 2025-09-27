type HTTPMethods = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: HTTPMethods
  body?: any
  headers?: Record<string, string>
}

interface StrapiResponse<T> {
  data: T
  meta: any
}

export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface StrapiMeta {
  pagination: StrapiPagination
}

export interface StrapiCollectionResponse<T> {
  data: T[]
  meta?: StrapiMeta
}

export function useApiRequests() {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1337/api';

  async function request<T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${baseURL}${endpoint}`
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    return response.json()
  }

  async function strapiFetcher<T>(
    endpoint: string,
    isCollection: true,
    options?: RequestOptions
  ): Promise<T[]>
  async function strapiFetcher<T>(
    endpoint: string,
    isCollection: false,
    options?: RequestOptions
  ): Promise<T>
  async function strapiFetcher<T>(
    endpoint: string,
    isCollection: boolean,
    options: RequestOptions = {}
  ): Promise<T | T[]> {
    const json = await request<StrapiResponse<T> | StrapiCollectionResponse<T>>(endpoint, options)
    return isCollection
      ? (json as StrapiCollectionResponse<T>).data
      : (json as StrapiResponse<T>).data
  }

  return { request, strapiFetcher }
}