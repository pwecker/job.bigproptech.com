import type { PiniaPluginContext } from 'pinia'
import TrackerClass from '@openreplay/tracker'

export function createOpenreplayPiniaPlugin(tracker: TrackerClass) {
  return (context: PiniaPluginContext) => {
    const { store } = context
    store.$subscribe((mutation, state) => {
      if (store.$id === 'auth') {
        const userId = state.user?.documentId || null
        tracker.setUserID(userId)
      }
    })
  }
}