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

export type GroupedTags = Record<Categories, string[]>;

export interface CategoryBadge {
  category: Categories
  value: string
}

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