<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import CategoryBadges from '@/components/Categories.vue'

// unmount
import { onUnmounted } from 'vue'
const watchers = ref<(() => void)[]>([])

// data
import { ref } from 'vue'
import { type ListData, listData } from '@/composables/useFullApi'
const { data, meta, loading, error, nextPage, fetchPage } = listData()

// filtered data
// import { useFilteredData, createFilters, type FilterFunction } from '@/composables/useFilters'
// const filters = ref<FilterFunction<ListData>[]>([])
// filters.value.push(createFilters.notNull('job_posted_at_datetime_utc'))
// filters.value.push(createFilters.notEmpty('tags'))
// const { filteredData } = useFilteredData<ListData>(data, { filters })

// ag grid
import { AgGridVue } from 'ag-grid-vue3'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { computed, watch } from 'vue'

// ag grid style
import { useAgGridTheme } from '@/composables/useAgGridTheme'
const { currentTheme } = useAgGridTheme()

// ag grid module
import { ModuleRegistry, RowStyleModule, RenderApiModule, InfiniteRowModelModule, PaginationModule, ValidationModule, type RowModelType, type GetRowIdFunc, type GetRowIdParams } from 'ag-grid-community'
ModuleRegistry.registerModules([
  RowStyleModule,
  RenderApiModule,
  PaginationModule,
  InfiniteRowModelModule,
  ...(import.meta.env.VITE_NODE_ENV !== "production" ? [ValidationModule] : []),
])

// ag grid attributes
const rowData = ref<ListData[] | null>(null);
const rowModelType = ref<RowModelType>('infinite')
const cacheBlockSize = ref(LIST_PAGE_SIZE);
const cacheOverflowSize = ref(2);
const maxConcurrentDatasourceRequests = ref(2);
const infiniteInitialRowCount = ref(1);
const maxBlocksInCache = ref(2);
const getRowId = ref<GetRowIdFunc>((params: GetRowIdParams) => {
  return params.data.documentId;
});

// ag grid columns
import { Timer, BriefcaseBusiness, Tags, MapPinned, Star, CircleCheck, CircleX } from 'lucide-vue-next'
const defaultColDef = {
  flex: 1
}
const colDefs = ref<ColDef[]>([
  {
    headerComponent: Icon,
    headerComponentParams: { icon: Star },
    maxWidth: 75,
    cellRenderer: Icon,
    valueGetter: (params) => {
      if(!params.data) return ''
      return getInteractionStatus(params.data.documentId).value.flavor
    },
    cellRendererParams: (params: ICellRendererParams) => {
      if (params.value === '') return { icon: null }
      if (params.value === 'like') return { icon: CircleCheck }
      if (params.value === 'dislike') return { icon: CircleX }
    }
  },
  {
    headerComponent: Icon,
    headerComponentParams: { icon: Timer },
    maxWidth: 100,
    valueGetter: (params) => {
      if(!params.data) return ''
      return params.data.job_posted_at_datetime_utc || params.data.updatedAt
    },
    valueFormatter: params => (params.value ? timeAgo(params.value) : '')
  },
  {
    headerComponent: Icon,
    headerComponentParams: { icon: MapPinned },
    maxWidth: 200,
    valueGetter: (params) => {
      if(!params.data) return ''
      return params.data.job_location
    },
    valueFormatter: params => params.value
  },
  {
    headerComponent: Icon,
    headerComponentParams: { icon: BriefcaseBusiness },
    flex: 2,
    valueGetter: (params) => {
      if(!params.data) return ''
      return params.data.job_title
    },
    valueFormatter: params => params.value
  },
  {
    headerComponent: Icon,
    headerComponentParams: { icon: Tags },
    flex: 3,
    valueGetter: (params) => {
      if(!params.data) return []
      return params.data.tags
    },
    cellRenderer: CategoryBadges
  }
])

// ag grid datasource
import { shallowRef } from 'vue'
import { type GridApi, type GridReadyEvent, type IDatasource, type IGetRowsParams } from 'ag-grid-community'
import { LIST_PAGE_SIZE } from '@/composables/useFullApi'
const gridApi = shallowRef<GridApi<ListData[]> | null>(null)
const onGridReady = async (params: GridReadyEvent) => {

  gridApi.value = params.api;
  params.api!.setGridOption('loading', loading.value);

  const updateData = (data: ListData[]) => {

    // todo hmr broke
    const dataSource: IDatasource = {
      rowCount: undefined,
      getRows: async (gridParams: IGetRowsParams) => {
        const start = gridParams.startRow
        const end = gridParams.endRow
        const page = Math.floor(start / LIST_PAGE_SIZE) + 1
        
        let last = -1
        if (meta.value && meta.value.pagination.total) {
          await fetchPage(page)
          last = meta.value.pagination.total
        } else {
          const more = await nextPage()
          if (!more) {
            last = data.length
          }
        }

        const rows = data.slice(start, end) ?? []
        gridParams.successCallback(rows, last)
      }
    }

    params.api!.setGridOption('datasource', dataSource);
  }

  const unwatch = watch<[boolean, ListData[] | null]>(() => [loading.value, data.value], 
    (newValues) => {
      const [loading, data] = newValues
      if (!loading && (data && data.length > 0)) {
        unwatch()
        updateData(data)
        params.api!.setGridOption('loading', loading);
      }
    }
  )

  watchers.value.push(unwatch)
};

// row interaction
import { useInteractedData } from '@/composables/useInteractions'
const { getInteractionStatus } = useInteractedData<ListData>(data, { getDataId: (item) => item.documentId })
import type { RowClassRules } from 'ag-grid-community'
const rowClassRules: RowClassRules = {
  'row-interacted': (params) => {
    if (!params.data) return false
    const interaction = getInteractionStatus(params.data.documentId)
    return interaction.value.hasInteraction
  }
}

function refreshRowById(documentId: string) {
  if (!gridApi.value) return
  const rowNode = gridApi.value.getRowNode(documentId)
  if (rowNode) {
    gridApi.value.redrawRows({ rowNodes: [rowNode] })
  }
}

import { useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const interactionsLength = computed(() => interactionStore.data?.length ?? 0)
const interactionsData = computed(() => interactionStore.data?.slice())
const unwatch = watch(() => [interactionsLength.value, interactionsData.value] as const,
  ([length, data], [oldLength, oldData]) => {
    const safeOldData = oldData || []
    const oldIds = safeOldData.map(v => v.documentId)
    const updates = data?.filter(v => !oldIds.includes(v.documentId))
    updates?.forEach(v => refreshRowById(v.datum.documentId))
})
watchers.value.push(unwatch)

// formatting
function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  
  return 'just now'
}

// click out
import type { RowClickedEvent } from 'ag-grid-community'
import { useRouter } from 'vue-router'
const router = useRouter()
const onRowClicked = (event: RowClickedEvent) => {
  router.push(`/${event.data.documentId}`)
}

onUnmounted(() => {
  watchers.value.forEach(unwatch => unwatch())
  watchers.value = []

  if (gridApi.value) {
    gridApi.value.destroy()
    gridApi.value = null
  }
})

</script>
<template>
  <AgGridVue
    class="ag-theme-container h-full lg:pb-3 lg:pr-3"
    :theme="currentTheme"
    :columnDefs="colDefs"
    :defaultColDef="defaultColDef"
    :rowModelType="rowModelType"
    :cacheBlockSize="cacheBlockSize"
    :cacheOverflowSize="cacheOverflowSize"
    :maxConcurrentDatasourceRequests="maxConcurrentDatasourceRequests"
    :infiniteInitialRowCount="infiniteInitialRowCount"
    :maxBlocksInCache="maxBlocksInCache"
    :pagination="true"
    :paginationPageSize="LIST_PAGE_SIZE"
    :getRowId="getRowId"
    :rowData="rowData"
    :rowClassRules="rowClassRules"
    :suppressCellFocus="true"
    @grid-ready="onGridReady"
    @row-clicked="onRowClicked"
  />
</template>
<style scoped>
:deep(.row-interacted) {
  color: var(--muted);
  user-select: none
}
:deep(.ag-paging-panel) {
  font-size: var(--ag-pagination-font-size)
}
</style>