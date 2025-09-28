import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useApi } from '@/composables/useApi'
import type { StrapiQueryOptions } from '@/composables/useApi/strapi'
import { type ListData } from '@/composables/useFullApi'

export type InteractionFlavor = 'like' | 'dislike' | 'seen'

export interface Interaction {
  documentId: string
  flavor: InteractionFlavor
  datum: ListData
  createdAt?: string
  updatedAt?: string
  isPending?: boolean
}

export interface InteractionInput {
  flavor: InteractionFlavor
  datum: { connect: string }
}

export interface InteractionDataReturn {
  data: Ref<Interaction[] | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  interactionsByDatum: ComputedRef<Map<string, Interaction>>
  allInteractions: ComputedRef<Interaction[]>
  refetch: (options?: { headers?: Record<string, string> }) => Promise<Interaction[] | null>
  getFlavor: (datumId: string) => InteractionFlavor | null
  setInteraction: (datumId: string, flavor: InteractionFlavor) => Promise<void>
  queueInteraction: (datum: ListData, flavor: InteractionFlavor) => void
  flushPendingInteractions: () => Promise<void>
  hydrateResource: () => void
  waitForHydration: () => Promise<void>
}

const INTERACTIONS_KEY = '/interactions'
const INTERACTIONS_QUERY: StrapiQueryOptions = {
  populate: {
    datum: {
      fields: ['documentId', 'job_title']
    },
    owner: {
      fields: ['username', 'email']
    }
  },
  sort: ['updatedAt:desc']
}

let interactionSingleton: InteractionDataReturn | null = null

export function useInteractionData(): InteractionDataReturn {
  if (interactionSingleton) {
    return interactionSingleton
  }

  const apiStore = useApi()
  const authStore = useAuthStore()

  function getAuthHeaders(): Record<string, string> {
    if (!authStore.jwt) return {}
    return { Authorization: `Bearer ${authStore.jwt}` }
  }

  const resource = apiStore.useStrapiResource<Interaction, InteractionInput>(
    INTERACTIONS_KEY,
    INTERACTIONS_QUERY,
    { defaultHeaders: getAuthHeaders }
  )

  let data = ref<Interaction[] | null>(null)
  let loading = ref(false)
  let error = ref<string | null>(null)
  let refetch: (options?: { headers?: Record<string, string> }) => Promise<Interaction[] | null> =
    async () => null
  
  const pendingInteractions = ref<Interaction[]>([])

  function hydrateResource() {
    if (authStore.jwt) {
      const res = resource.getAll()
      data.value = res.data.value
      loading.value = res.loading.value
      error.value = res.error.value

      // forward future changes (keep refs in sync)
      watch(res.data, v => { data.value = v })
      watch(res.loading, v => { loading.value = v })
      watch(res.error, v => { error.value = v })
      refetch = res.refetch
    } else {
      data.value = null
      refetch = async () => null
    }

    return
  }

  function waitForHydration(): Promise<void> {
    return new Promise((resolve) => {
      const stop = watch(
        [data, loading],
        ([d, l]) => {
          if (d !== null && l === false) {
            stop()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }

  hydrateResource()

  const interactionsByDatum = computed(() => {
    const map = new Map<string, Interaction>()
    
    if (data.value) {
      for (const interaction of data.value) {
        if (interaction.datum?.documentId) {
          map.set(interaction.datum.documentId, interaction)
        }
      }
    }

    for (const p of pendingInteractions.value) {
      if (!map.has(p.datum.documentId)) {
        const stub: Interaction = {
          documentId: `pending:${p.flavor}:${p.datum.documentId}`,
          flavor: p.flavor,
          datum: p.datum,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPending: true
        }
        map.set(p.datum.documentId, stub)
      }
    }

    return map
  })

  const allInteractions = computed(() => Array.from(interactionsByDatum.value.values()))

  function getFlavor(datumId: string): InteractionFlavor | null {
    return interactionsByDatum.value.get(datumId)?.flavor ?? null
  }

  async function setInteraction(datumId: string, flavor: InteractionFlavor) {
    const headers = getAuthHeaders()
  
    const existingDb = data.value?.find(i => i.datum.documentId === datumId)
  
    try {
      if (existingDb) {
        const updated = await resource.update(
          existingDb.documentId,
          { flavor, datum: { connect: datumId } },
          { headers }
        )
        if (updated && data.value) {
          const idx = data.value.findIndex(i => i.documentId === updated.documentId)
          if (idx >= 0) {
            data.value[idx] = updated
          } else {
            data.value.push(updated)
          }
        }
        pendingInteractions.value = pendingInteractions.value.filter(p => p.datum.documentId !== datumId)
      } else {
        const created = await resource.create(
          { flavor, datum: { connect: datumId } },
          { headers }
        )
        if (created) {
          data.value?.push(created)
          pendingInteractions.value = pendingInteractions.value.filter(p => p.datum.documentId !== datumId)
        }
      }
    } catch (err) {
      console.error('Failed to set interaction:', err)
    }
  }

  // todo: make: datumId: string, flavor: InteractionFlavor vv
  function queueInteraction(datum: ListData, flavor: InteractionFlavor) {
    const existingPending = pendingInteractions.value.find(p => p.datum.documentId === datum.documentId)
    if (existingPending) {
      existingPending.documentId = `pending:${flavor}:${datum.documentId}`
      existingPending.flavor = flavor
    } else {
      pendingInteractions.value.push({ documentId: `pending:${flavor}:${datum.documentId}`, datum, flavor })
    }
  
    if (authStore.jwt) {
      void setInteraction(datum.documentId, flavor)
    }
  }

  async function flushPendingInteractions() {
    if (!pendingInteractions.value.length) return
    const toFlush = [...pendingInteractions.value]
    await Promise.all(toFlush.map(p => setInteraction(p.datum.documentId, p.flavor)))
    pendingInteractions.value = []
  }

  interactionSingleton = {
    data,
    loading,
    error,
    interactionsByDatum,
    allInteractions,
    refetch,
    getFlavor,
    setInteraction,
    queueInteraction,
    flushPendingInteractions,
    hydrateResource,
    waitForHydration
  }

  return interactionSingleton
}

export const useInteractionStore = defineStore('interaction', () => {
  const authStore = useAuthStore()
  const interactionData = useInteractionData()

  watch(
    () => authStore.jwt,
    async (jwt) => {
      if (jwt) {
        interactionData.hydrateResource()
        await interactionData.waitForHydration()
        await interactionData.flushPendingInteractions()
      } else {
        // todo: computed is readonly
        // interactionData.data.value = null
      }
    }
  )

  return {
    data: interactionData.data,
    loading: interactionData.loading,
    error: interactionData.error,
    interactionsByDatum: interactionData.interactionsByDatum,
    allInteractions: interactionData.allInteractions,
    fetchInteractions: () => interactionData.refetch(),
    getFlavor: interactionData.getFlavor,
    setInteraction: interactionData.setInteraction,
    queueInteraction: interactionData.queueInteraction,
    flushPendingInteractions: interactionData.flushPendingInteractions
  }
})