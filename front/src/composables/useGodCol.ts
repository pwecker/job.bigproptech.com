import { type ListData } from '@/composables/useFullApi'
import { type CategorySet } from '@/composables/useTagApi'
import { type InteractionFlavor, useInteractionStore } from '@/stores/interaction'
import { type Tag } from '@/composables/useFullApi'

interface useGodColReturn {
  relativeDateLabel(utcString: string | null): string | null
  parseTitle(titleText: string | null | undefined): string[] | null
  parseDescription(longtext: string | null | undefined): string[] | null
  parseCategories(tags: Tag[] | null | undefined): CategorySet | null
  getInteractionStatus(documentId: string | null | undefined): InteractionFlavor | null
  godCollString(data: ListData): string
}

export const UseGodCol = (): useGodColReturn => {

  function relativeDateLabel(utcString: string | null) {
    if (!utcString) return null

    const inputDate = new Date(utcString)
    if (isNaN(inputDate.getTime())) {
      return null
    }
  
    const now = new Date()
    const diffMs = now.getTime() - inputDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
    // Normalize to start of week (Monday as start)
    const getWeekStart = (d: Date) => {
      const date = new Date(d)
      const day = date.getDay() // 0 = Sun, 1 = Mon...
      const diff = (day === 0 ? -6 : 1) - day
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() + diff)
      return date
    }
  
    const startOfThisWeek = getWeekStart(now)
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  
    if (diffDays < 1) {
      return 'New'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (inputDate >= startOfThisWeek) {
      return 'This week'
    } else if (inputDate >= startOfLastWeek) {
      return 'Last week'
    } else if (diffDays < 60) {
      return 'Weeks ago'
    } else {
      return 'Months ago'
    }
  }

  function parseTitle(titleText: string | null | undefined) {
    if (!titleText) return null
    return titleText.split(' ')
  }

  function parseDescription(longtext: string | null | undefined) {
    if (!longtext) return null
    
    const maxLength = 800
    return longtext
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[^\w\s.,!?;:'"()-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, maxLength)
      .split(' ')
  }

  function parseCategories(tags: Tag[] | null | undefined) {
    if (!tags || tags.length === 0) return null
    
    return tags.reduce((acc: any, current: any) => {
      const { category, value: val, quantifier } = current
      acc[category] = acc[category] || []
      acc[category].push({val, quantifier})
      return acc
    }, {})
  }

  const interactionStore = useInteractionStore()

  function getInteractionStatus(documentId: string | null | undefined) {
    if (!documentId) return null
    return interactionStore.getFlavor(documentId)
  }

  const godCollString = (data: ListData) => {
    const datetimeutc = data.job_posted_at_datetime_utc || data.updatedAt
    return `
      ${relativeDateLabel(datetimeutc)}
      ${data.job_title}
    `
  }

  return {
    relativeDateLabel,
    parseTitle,
    parseDescription,
    parseCategories,
    getInteractionStatus,
    godCollString
  }
}