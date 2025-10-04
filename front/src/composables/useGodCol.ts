import { type ListData } from '@/composables/useFullApi'

export const UseGodCol = () => {

  function relativeDateLabel(utcString: string): string {
    const inputDate = new Date(utcString)
    if (isNaN(inputDate.getTime())) {
      throw new Error(`Invalid date string: ${utcString}`)
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

  const godCollVal = (data: ListData) => {
    const datetime = data.job_posted_at_datetime_utc || data.updatedAt
    return `
      ${relativeDateLabel(datetime)}
      ${data.job_title}
    `
  }
  return {
    godCollVal
  }
}