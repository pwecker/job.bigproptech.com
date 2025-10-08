import { computed, type ComputedRef, type Ref } from 'vue'
import { type InteractionFlavor, type Interaction, useInteractionStore,  } from '@/stores/interaction'

export interface InteractedDataItem<T = any> {
  datum: T
  interaction: Interaction | null
  hasInteraction: boolean
}

export interface InteractedDataOptions<T> {
  getDataId: (item: T) => string
  filter?: (item: InteractedDataItem<T>) => boolean
  limit?: number
  center?: Ref<number | undefined>
}

export interface InteractedDataReturn<T> {
  // joinedData: ComputedRef<InteractedDataItem<T>[]>
  // interactedData: ComputedRef<InteractedDataItem<T>[]>
  // uninteractedData: ComputedRef<InteractedDataItem<T>[]>
  // getByFlavor: (flavor: InteractionFlavor) => ComputedRef<InteractedDataItem<T>[]>
  // getFiltered: (filter: (item: InteractedDataItem<T>) => boolean) => ComputedRef<InteractedDataItem<T>[]>
  uninteractedChunk: ComputedRef<InteractedDataItem<T>[] | null>
  getInteractionStatus: (id: string) => ComputedRef<{ 
    hasInteraction: boolean
    flavor: InteractionFlavor | null
    isPending?: boolean 
  }>
  // getUninteractedNeighbors: (currentId: string) => ComputedRef<{
  //   prev: string;
  //   current: string;
  //   next: string
  // }>
}

export function useInteractedData<T>(
  dataRef: Ref<T[] | null>, 
  options: InteractedDataOptions<T>
): InteractedDataReturn<T> {
  const interactionStore = useInteractionStore()
  const { getDataId, filter, limit = 2, center } = options

  const uninteractedChunk = computed(() => {
    if (!dataRef.value || dataRef.value.length === 0) return null

    const validItems = dataRef.value.filter((item): item is T => item != null)
    if (validItems.length === 0) return null
    
    const uninteractedItems: InteractedDataItem<T>[] = []
    const centerIndex = center?.value ?? -1 
    
    if (centerIndex !== undefined && centerIndex >= 0 && centerIndex < validItems.length) {
      // Target-based search: look around the target index
      const maxDistance = Math.max(validItems.length, limit * 2)
      
      for (let distance = 0; distance <= maxDistance && uninteractedItems.length < limit; distance++) {
        // Check positions at increasing distances from target
        const positions = distance === 0 ? [centerIndex] : [centerIndex - distance, centerIndex + distance]
        
        for (const pos of positions) {
          if (uninteractedItems.length >= limit) break
          if (pos < 0 || pos >= validItems.length) continue
          
          const item = validItems[pos]
          const id = getDataId(item)
          const interaction = interactionStore.interactionsByDatum.get(id) ?? null
          const hasInteraction = !!interaction
          
          if (!hasInteraction) {
            const joinedItem: InteractedDataItem<T> = {
              datum: item,
              interaction,
              hasInteraction
            }
            
            // Apply filter if provided
            if (!filter || filter(joinedItem)) {
              uninteractedItems.push(joinedItem)
            }
          }
        }
      }
    } else {
      // Default behavior: search from start of array
      for (const item of validItems) {
        if (uninteractedItems.length >= limit) break
        
        const id = getDataId(item)
        const interaction = interactionStore.interactionsByDatum.get(id) ?? null
        const hasInteraction = !!interaction
        
        if (!hasInteraction) {
          const joinedItem: InteractedDataItem<T> = {
            datum: item,
            interaction,
            hasInteraction
          }
          
          // Apply filter if provided
          if (!filter || filter(joinedItem)) {
            uninteractedItems.push(joinedItem)
          }
        }
      }
    }
    
    if (uninteractedItems.length === 0) {
      return null
    }
    
    const result: InteractedDataItem<T>[] = []
    for (let i = 0; i < limit; i++) {
      result.push(uninteractedItems[i % uninteractedItems.length])
    }
    
    return result
  })

  function getInteractionStatus(id: string) {
    return computed(() => {
      const interaction = interactionStore.interactionsByDatum.get(id) ?? null
      return {
        hasInteraction: !!interaction,
        flavor: interaction?.flavor || null,
        isPending: interaction?.isPending,
        interaction
      }
    })
  }

  return {
    uninteractedChunk,
    getInteractionStatus
  }
}