<script setup lang="ts">

// user
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

// account settings
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-vue-next'
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { toggleDark } = uxStore
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = (() => router.push('logout'))

// onboarding
import { useOnboarding } from '@/composables/useOnboarding'
const onboarding = useOnboarding()

// components
import { BriefcaseBusiness } from 'lucide-vue-next'
import Interactions from '@/components/Interactions.vue'
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
import { Info } from 'lucide-vue-next'

</script>
<template>
  <SidebarProvider :key="isAuthenticated + ''" :defaultOpen="isAuthenticated" class="h-full w-full select-none">
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
          <LogOut v-if="isAuthenticated"/>
        </Button>
        <div class="overflow-hidden flex items-center truncate text-sm font-light dark:font-light tracking-wider">
          <Button
            v-if="!isAuthenticated"
            class="cursor-pointer text-primary scale-90 mr-[var(--app-xs-spacing)]"
            variant="ghost"
            @click="onboarding.reset();onboarding.start()"
            size="icon"
          ><Info/></Button>
          {{ authStore.user?.username || authStore.user?.email || 'Guest' }}
        </div>
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
<style>
/* override shadcn's internal fixed layout */
/* [data-slot="sidebar-wrapper"] [data-slot="sidebar"] {
  position:relative
}
:deep(.sidebar) {
  opacity: 0.4;
  position: relative !important;
  height: auto !important;
  top: auto !important;
}
:deep(.sidebar-provider) {
  position: relative !important;
} */
</style>