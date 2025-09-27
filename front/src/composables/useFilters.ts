import { type Ref, computed } from 'vue'

interface SortConfig<T> {
  field: keyof T
  direction: 'asc' | 'desc'
}

export interface FilterFunction<T> {
  (item: T): boolean
}

interface FilteredDataOptions<T> {
  filters?: Ref<FilterFunction<T>[]>
  sorting?: Ref<SortConfig<T> | null>
}

interface FilteredDataReturn <T>{
  filteredData: Ref<T[] | null>
}

export function useFilteredData<T extends Record<string, any>>(
  dataSource: Ref<T[] | null>,
  options: FilteredDataOptions<T>
): FilteredDataReturn<T> {
  const filteredData = computed<T[] | null>(() => {
    if (!dataSource.value) return null
    let result = [...dataSource.value]

    // filter
    if (options.filters?.value?.length) {
      result = result.filter(item => 
        options.filters!.value!.every(filterFn => filterFn(item))
      )
    }

    return result
  })

  return {
    filteredData
  }
}

interface CreateFilters {
  search: <T>(fields: (keyof T)[], searchTerm: string) => FilterFunction<T>
  range: <T>(field: keyof T, min?: number, max?: number) => FilterFunction<T>
  equals: <T>(field: keyof T, targetValue: any) => FilterFunction<T>
  notNull: <T>(field: keyof T) => FilterFunction<T>
  notEmpty: <T>(field: keyof T) => FilterFunction<T>
  includes: <T>(field: keyof T, targetValues: any[]) => FilterFunction<T>
  dateRange: <T>(field: keyof T, from?: Date, to?: Date) => FilterFunction<T>
}

export const createFilters: CreateFilters = {
  search: <T>(fields: (keyof T)[], searchTerm: string): FilterFunction<T> => 
    (item: T) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return fields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term)
        }
        if (Array.isArray(value)) {
          return value.some(v => 
            typeof v === 'string' && v.toLowerCase().includes(term) ||
            (typeof v === 'object' && v?.value && typeof v.value === 'string' && v.value.toLowerCase().includes(term))
          )
        }
        return false
      })
    },

  range: <T>(field: keyof T, min?: number, max?: number): FilterFunction<T> =>
    (item: T) => {
      const value = item[field] as number
      if (typeof value !== 'number') return true
      if (min !== undefined && value < min) return false
      if (max !== undefined && value > max) return false
      return true
    },

  equals: <T>(field: keyof T, targetValue: any): FilterFunction<T> =>
    (item: T) => item[field] === targetValue,

  notNull: <T>(field: keyof T): FilterFunction<T> =>
    (item: T) => item[field] !== null,

  notEmpty: <T>(field: keyof T): FilterFunction<T> =>
    (item: T) => {
      return Array.isArray(item[field]) && item[field].length > 0
    },

  includes: <T>(field: keyof T, targetValues: any[]): FilterFunction<T> =>
    (item: T) => {
      const value = item[field]
      if (Array.isArray(value)) {
        return value.some(v => targetValues.includes(v))
      }
      return targetValues.includes(value)
    },

  dateRange: <T>(field: keyof T, from?: Date, to?: Date): FilterFunction<T> =>
    (item: T) => {
      const value = item[field]
      const date = value instanceof Date ? value : new Date(value as string)
      if (isNaN(date.getTime())) return true
      if (from && date < from) return false
      if (to && date > to) return false
      return true
    }
}