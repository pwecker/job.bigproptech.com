export interface StrapiQueryOptions {
  fields?: string[]
  populate?: string[] | Record<string, any>
  filters?: Record<string, any>
  sort?: string[]
  pagination?: {
    page?: number
    pageSize?: number
    start?: number
    limit?: number
  }
  locale?: string
  publicationState?: 'live' | 'preview'
}

function appendPopulate(
  params: URLSearchParams,
  prefix: string,
  value: any
) {
  if (Array.isArray(value)) {
    value.forEach((field, index) => {
      params.append(`${prefix}[${index}]`, field)
    })
  } else if (typeof value === 'object' && value !== null) {
    Object.entries(value).forEach(([k, v]) => {
      appendPopulate(params, `${prefix}[${k}]`, v)
    })
  } else {
    params.append(prefix, String(value))
  }
}

export function buildStrapiQuery(options: StrapiQueryOptions): string {
  const params = new URLSearchParams()

  // fields
  if (options.fields?.length) {
    options.fields.forEach((field, index) => {
      params.append(`fields[${index}]`, field)
    })
  }

  // populate
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach((field, index) => {
        params.append(`populate[${index}]`, field)
      })
    } else {
      // object populate (nested relations)
      Object.entries(options.populate).forEach(([key, value]) => {
        appendPopulate(params, `populate[${key}]`, value)
      })
    }
  }

  // filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([operator, val]) => {
          params.append(`filters[${key}][${operator}]`, String(val))
        })
      } else {
        params.append(`filters[${key}]`, String(value))
      }
    })
  }

  // sort
  if (options.sort?.length) {
    options.sort.forEach((field, index) => {
      params.append(`sort[${index}]`, field)
    })
  }

  // pagination
  if (options.pagination) {
    Object.entries(options.pagination).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(`pagination[${key}]`, String(value))
      }
    })
  }

  // locale
  if (options.locale) {
    params.append('locale', options.locale)
  }

  // publication state
  if (options.publicationState) {
    params.append('publicationState', options.publicationState)
  }

  return params.toString()
}