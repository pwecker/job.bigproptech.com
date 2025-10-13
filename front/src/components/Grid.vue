<script setup lang="ts">

// user flow
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
// site flow
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { bottomed } = storeToRefs(uxStore)
const gridUnlocked = computed(() => {
  return isAuthenticated.value || bottomed.value
})

import Icon from '@/components/Icon.vue'
import { onMounted, onUnmounted } from 'vue'
if (import.meta.hot) {
  if (!import.meta.hot.data.gridState) {
    import.meta.hot.data.gridState = { gridApi: null, watchers: [] }
  }
}
const gridState = import.meta.hot ? import.meta.hot.data.gridState: { gridApi: null, watchers: [] }
const watchers = ref<(() => void)[]>([])

// rows' lines
const rowHeight = ref(window.innerWidth < 769 ? 119 : 95);
// const rowPadding = ref(window.innerWidth < 769 ? 5 : 3);

let resizeTimeout: NodeJS.Timeout;

// todo: better than timeout?
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const newHeight = window.innerWidth < 769 ? 119 : 95;
    if (newHeight !== rowHeight.value) {
      rowHeight.value = newHeight;
    }
  }, 150);
};

// mount
onMounted(() => {
  window.addEventListener('resize', handleResize);
})

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
import { ModuleRegistry, RowStyleModule, RenderApiModule, InfiniteRowModelModule, PaginationModule, CellStyleModule, ValidationModule, type RowModelType, type GetRowIdFunc, type GetRowIdParams } from 'ag-grid-community'
ModuleRegistry.registerModules([
  CellStyleModule,
  RowStyleModule,
  RenderApiModule,
  PaginationModule,
  InfiniteRowModelModule,
  ...(import.meta.env.VITE_NODE_ENV !== "production" ? [ValidationModule] : []),
])

// ag grid attributes
const rowData = ref<ListData[] | null>(null)
const rowModelType = ref<RowModelType>('infinite')
const cacheBlockSize = ref(LIST_PAGE_SIZE)
const cacheOverflowSize = ref(2)
const maxConcurrentDatasourceRequests = ref(2)
const infiniteInitialRowCount = ref(1)
const maxBlocksInCache = ref(2)
const pagination = ref(false)
const getRowId = ref<GetRowIdFunc>((params: GetRowIdParams) => {
  return params.data.documentId;
});

// ag grid values
import GodCell from './God.vue'
import { UseGodCol } from '@/composables/useGodCol'
defineOptions({
  components: {
    GodCell,
  },
});
// ag grid columns
import { Timer, BriefcaseBusiness, Tags, MapPinned, Star, CircleCheck, CircleX } from 'lucide-vue-next'
const defaultColDef = {
  flex: 1
}
const colDefs = computed<ColDef[]>(() => [
  {
    wrapText: true,
    cellStyle: { 
      'clip-path': `inset(var(--app-xs-spacing) 0px var(--app-sm-spacing))`,
      'padding-top': 'var(--app-xs-spacing)'
    },
    headerComponent: Icon,
    headerComponentParams: { icon: BriefcaseBusiness },
    cellRenderer: 'GodCell',
    valueGetter: (params: ValueGetterParams) => {
      const data = params.data
      const { relativeDateLabel, parseDescription, parseTitle, parseCategories } = UseGodCol()
      return {
        relativeDate: relativeDateLabel(data?.job_posted_at_datetime_utc || data?.updatedAt),
        title: parseTitle(data?.job_title),
        description: parseDescription(data?.job_description),
        categories: parseCategories(data?.tags),
        employer: data?.employer_name || null,
        location: data?.job_location || null,
        documentId: data?.documentId || null
      }
    }
  }
])

// ag grid datasource

// page number
const startNumber = ref(0)
const endNumber = ref(LIST_PAGE_SIZE as number)
const lastNumberString = ref('More')
import { shallowRef } from 'vue'
import { type GridApi, type GridReadyEvent, type IDatasource, type IGetRowsParams, type ValueGetterParams } from 'ag-grid-community'
import { LIST_PAGE_SIZE } from '@/composables/useFullApi'
const gridApi = shallowRef<GridApi<ListData[]> | null>(null)
const onGridReady = async (params: GridReadyEvent) => {

  gridApi.value = params.api;
  
  if (import.meta.hot) {
    gridState.gridApi = gridApi.value
  }
  params.api!.setGridOption('loading', loading.value);

  const updateData = (data: ListData[]) => {

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

        startNumber.value = start
        endNumber.value = last > 0 && last < end ? last : end
        if (last >= 0) lastNumberString.value = last.toString()

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

  if (!loading.value && data.value && data.value.length > 0) {
    updateData(data.value)
  }
};

// row interaction
// todo: return from higher up pipeline
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
const interactionsLength = computed(() => interactionStore.allInteractions?.length ?? 0)
const interactionsData = computed(() => interactionStore.allInteractions?.slice())
const unwatch = watch(() => [interactionsLength.value, interactionsData.value] as const,
  ([length, data], [oldLength, oldData]) => {
    const safeOldData = oldData || []
    const oldIds = safeOldData.map(v => v.documentId)
    const updates = data?.filter(v => !oldIds.includes(v.documentId))
    updates?.forEach(v => refreshRowById(v.datum.documentId))
})
watchers.value.push(unwatch)

// click out
import type { RowClickedEvent } from 'ag-grid-community'
import { useRouter } from 'vue-router'
const router = useRouter()
const onRowClicked = (event: RowClickedEvent) => {
  router.push(`/${event.data.documentId}`)
}

// unmount
onUnmounted(() => {
  clearTimeout(resizeTimeout);
  window.removeEventListener('resize', handleResize);
  watchers.value.forEach(unwatch => unwatch())
  watchers.value = []

  if (!import.meta.hot) {
    if (gridApi.value) {
      gridApi.value.destroy()
      gridApi.value = null
    }
  }
  if (import.meta.hot) {
    gridState.watchers = watchers.value
  }

  if (gridApi.value) {
    gridApi.value.destroy()
    gridApi.value = null
  }
})


import Loading from '@/components/Loading.vue'
</script>
<template>
  <AgGridVue
    :class="{'pointer-events-none': !gridUnlocked }"
    class="ag-theme-container h-full"
    :theme="currentTheme"
    :columnDefs="colDefs"
    :defaultColDef="defaultColDef"
    :rowModelType="rowModelType"
    :cacheBlockSize="cacheBlockSize"
    :cacheOverflowSize="cacheOverflowSize"
    :maxConcurrentDatasourceRequests="maxConcurrentDatasourceRequests"
    :infiniteInitialRowCount="infiniteInitialRowCount"
    :maxBlocksInCache="maxBlocksInCache"
    :pagination="pagination"
    :paginationPageSize="LIST_PAGE_SIZE"
    :getRowId="getRowId"
    :rowData="rowData"
    :rowClassRules="rowClassRules"
    :suppressCellFocus="true"
    :rowHeight="rowHeight"
    @grid-ready="onGridReady"
    @row-clicked="onRowClicked"
    :loadingOverlayComponent="Loading"
  />
  <div class="border-t-1 border-t-border h-[var(--app-footer-height)] w-full bg-background flex justify-center items-center p-3 text-primary text-base font-light">
    {{ startNumber }} to {{  endNumber }} of {{ lastNumberString }}
  </div>
</template>
<style scoped>
:deep(.row-interacted) {
  user-select: none;
}
:deep(.ag-row) {
  border-style: dashed;
}
:deep(.ag-paging-panel) {
  font-size: var(--ag-pagination-font-size);
  height: var(--app-footer-height);
}
:deep(.ag-paging-panel) {
  gap: 0;
  justify-content: space-between;
}
:deep(.ag-paging-page-size) {
  display: flex;
  align-items: center;
  height:  var(--app-footer-height);
}
:deep(.ag-picker-collapsed) {
  min-height:  2.5em;
  height:  2.5em;
}
</style>