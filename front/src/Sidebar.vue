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
import { BriefcaseBusiness } from 'lucide-vue-next'
import Interactions from './components/Interactions.vue'
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
    <Sidebar class="border-r-1 border-r-border">
      <SidebarHeader class="pl-2.5 h-[var(--app-header-height)] flex justify-center">
        <BriefcaseBusiness class="scale-65 text-primary"/>
      </SidebarHeader>
      <SidebarContent class="text-primary font-light">

        <Interactions>
          <!-- likes -->
           <template #liked="{ items, title }">
            <SidebarGroup>
              <SidebarGroupLabel class="font-light text-sm text-muted-foreground">{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem class="h-[var(--app-md-spacing)]" v-for="i in items" :key="`likes:${i.documentId}`">
                    <SidebarMenuButton size="sm" class="py-0 font-light dark:font-light text-sm rounded-none">
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
              <SidebarGroupLabel class="font-light text-sm text-muted-foreground">{{ title }}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem class="h-[var(--app-md-spacing)]" v-for="i in items" :key="`recent:${i.documentId}`">
                    <SidebarMenuButton size="sm" class="py-0 font-light dark:font-light text-sm rounded-none">
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
      <SidebarFooter class="border-t-1 border-t-border w-full h-[var(--app-footer-height)] flex flex-row justify-between items-center px-1">
        <Button
          class="cursor-pointer text-primary scale-90"
          variant="ghost"
          @click="logout()"
          size="icon"
        >
          <LogOut/>
        </Button>
        <div class="overflow-hidden truncate text-sm font-light dark:font-light tracking-wider">{{ authStore.user?.username || 'Guest' }}</div>
        <Button
          class="cursor-pointer text-primary scale-90"
          variant="ghost"
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