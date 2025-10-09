import { type Ref, type ComputedRef } from 'vue'
import { useApi } from '@/composables/useApi'
import type { StrapiQueryOptions } from '@/composables/useApi/strapi'

export enum Categories {
  ProgrammingLanguage = "programming language",
  Framework = "framework",
  CloudPlatform = "cloud platform",
  Database = "database",
  DevopsTool = "devops tool",
  Testing = "testing",
  SecurityClearance = "security clearance",
  EducationLevel = "education level",
  DegreeField = "degree field",
  Compensation = "compensation",
  Benefits = "benefits",
  WorkArrangement = "work arrangement",
  EmploymentType = "employment type",
  PerksCulture = "perks & culture",
}

enum Quantifiers {
  Required = 'required',
  Preferred = 'preferred',
  Suggested = 'suggested'
}

type CategoryColors = Record<Categories, string>
export const categoryColors: CategoryColors = {
  [Categories.ProgrammingLanguage]: 'bg-indigo-400 dark:bg-indigo-300',
  [Categories.Framework]: 'bg-teal-400 dark:bg-teal-500',
  [Categories.CloudPlatform]: 'bg-indigo-300 dark:bg-indigo-400',
  [Categories.Database]: 'bg-red-400 dark:bg-red-500',
  [Categories.DevopsTool]: 'bg-orange-300 dark:bg-orange-300',
  [Categories.Testing]: 'bg-orange-300 dark:bg-orange-300',
  [Categories.SecurityClearance]: 'bg-slate-300 dark:bg-slate-600',
  [Categories.EducationLevel]: 'bg-yellow-300 dark:bg-yellow-200',
  [Categories.DegreeField]: 'bg-yellow-300 dark:bg-yellow-200',
  [Categories.Compensation]: 'bg-emerald-400 dark:bg-emerald-300',
  [Categories.Benefits]: 'bg-emerald-400 dark:bg-emerald-300',
  [Categories.WorkArrangement]: 'bg-sky-300 dark:bg-sky-500',
  [Categories.EmploymentType]: 'bg-sky-300 dark:bg-sky-500',
  [Categories.PerksCulture]: 'bg-sky-300 dark:bg-sky-500'
}

export type GroupedTags = Record<Categories, string[]>;

export interface CategoryBadge {
  category: Categories
  value: string
}

interface CategoryValue {
  val: string
  quantifier: Quantifiers | null
}

export type CategorySet = Record<Categories, CategoryValue[]>

export interface TagsDataReturn {
  data: Ref<GroupedTags | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  refetch: () => Promise<any | null>
}

export const DATA_TAGS_KEY = '/tags'
const DATA_TAGS_OPTIONS: StrapiQueryOptions = {}

export function getTagData(documentId: string, authHeaders?: () => Record<string, string>): TagsDataReturn {
  const apiStore = useApi()
  const resource = apiStore.useStrapiResource<GroupedTags>(
    DATA_TAGS_KEY,
    DATA_TAGS_OPTIONS,
    { defaultHeaders: authHeaders }
  )

  return resource.getOne(documentId)
}