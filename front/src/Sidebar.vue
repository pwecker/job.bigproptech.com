<script setup lang="ts">
// components
import Interactions from './components/Interactions.vue';
import { 
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
</script>
<template>
  <SidebarProvider class="h-full w-full select-none">
    <Sidebar>
      <SidebarHeader class="h-[var(--app-header-height)] flex items-center"></SidebarHeader>
      <SidebarContent class="text-stone-600 dark:text-stone-300">

        <Interactions>
          <!-- likes -->
           <template #liked="{ items, title }">
            <SidebarGroup>
              <SidebarGroupLabel>{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="i in items" :key="`likes:${i.documentId}`">
                    <SidebarMenuButton>
                      <RouterLink class="whitespace-nowrap text-ellipsis overflow-hidden" :to="i.datum.documentId">
                        {{ i.datum.job_title }}
                      </RouterLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </template>
          <!-- recent -->
          <template #recent="{ items, title }">
            <SidebarGroup>
              <SidebarGroupLabel>{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="i in items" :key="`recent:${i.documentId}`">
                    <SidebarMenuButton>
                      <RouterLink class="whitespace-nowrap text-ellipsis overflow-hidden" :to="i.datum.documentId">
                        {{ i.datum.job_title }}
                      </RouterLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
           </template>
        </Interactions>

      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset class="overflow-hidden">
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>