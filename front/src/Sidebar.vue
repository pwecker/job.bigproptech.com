<script setup lang="ts">

// user
import { computed } from 'vue'
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()

// account settings
import { Button } from '@/components/ui/button'
import { Settings, Sun, Moon, LogOut } from 'lucide-vue-next'
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { toggleDark } = uxStore
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = (() => router.push('logout'))

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
    <Sidebar class="border-none">
      <SidebarHeader class="h-[var(--app-header-height)] flex items-center"></SidebarHeader>
      <SidebarContent class="text-stone-600 dark:text-stone-300">

        <Interactions>
          <!-- likes -->
           <template #liked="{ items, title }">
            <SidebarGroup>
              <SidebarGroupLabel class="font-thin text-sm">{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="i in items" :key="`likes:${i.documentId}`">
                    <SidebarMenuButton size="sm" class="font-light text-sm">
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
              <SidebarGroupLabel class="font-thin text-sm">{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="i in items" :key="`recent:${i.documentId}`">
                    <SidebarMenuButton size="sm" class="font-light text-sm">
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
      <SidebarFooter class="w-full flex flex-row justify-between items-center p-0 pl-3 py-1">
        <Button
          class="cursor-pointer"
          variant="outline"
          @click="logout()"
          size="icon"
        >
          <LogOut/>
        </Button>
        <div class="overflow-hidden truncate text-xs font-thin tracking-wider">{{ authStore.user?.username || 'Guest' }}</div>
        <Button
          class="cursor-pointer"
          variant="outline"
          @click="toggleDark()"
          size="icon"
        >
          <Moon class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Sun class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
        </Button>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset class="overflow-hidden">
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>