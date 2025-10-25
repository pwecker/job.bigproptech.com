<script setup lang="ts">
// user
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

// account settings
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = (() => router.push('logout'))

// sidebar
import { watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '@/components/ui/sidebar'
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { toggleDark, setSidebarOpen } = uxStore

const { setOpenMobile, isMobile, openMobile, open } = useSidebar()
const isSidebarOpen = computed(() => isMobile.value ? openMobile.value : open.value)
watch(isSidebarOpen, (val) => {
  setSidebarOpen(val)
}, { immediate: true })

const route = useRoute()
watch(route, (to) => {
  if (to.name === 'stack' && openMobile.value) {
    setOpenMobile(false)
  }
})

// onboarding
import { useOnboarding } from '@/composables/useOnboarding'
const onboarding = useOnboarding()

// interactions
import { type InteractionDateGroup, useInteractionStore } from '@/stores/interaction'
const interactionStore = useInteractionStore()
const { interactionsByDate } = storeToRefs(interactionStore)

// components
import { BriefcaseBusiness } from 'lucide-vue-next'
import { 
  SidebarHeader,
  SidebarInset,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Info, Plus, Minus } from 'lucide-vue-next'

import Interaction from '@/components/Interaction.vue'

</script>
<template>
  
    <Sidebar class="border-border">
      <SidebarHeader class="pl-2.5 h-[var(--app-header-height)] flex justify-center">
        <BriefcaseBusiness class="scale-65 text-primary"/>
      </SidebarHeader>
      <SidebarContent class="text-primary font-light">

        <SidebarGroup>
          <SidebarGroupLabel  v-if="interactionsByDate.length > 0" class="font-light text-sm text-muted-foreground">
            Interactions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                v-for="(item, index) in interactionsByDate as InteractionDateGroup[]"
                :key="item.date"
                :default-open="index === 0"
                class="group/collapsible"
              >

                <!-- date group -->
                <SidebarMenuItem>
                  <CollapsibleTrigger as-child>
                    <SidebarMenuButton>
                      {{ item.date }}
                      <Plus class="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus class="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent v-if="item.interactions.length">
                    <SidebarMenuSub>
                      <SidebarMenuSubItem class="flex justify-start items-center" v-for="interaction in item.interactions" :key="interaction.datum.job_title">
                        <Interaction :interaction="interaction"/>
                        <SidebarMenuSubButton
                          class="w-full"
                          as-child
                        >
                          <RouterLink class="ml-[var(--app-xs-spacing)]"  :to="interaction.datum.documentId">
                            <span class="truncate">{{ interaction.datum.job_title }}</span>
                          </RouterLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>

              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <!--
        v-for="group in interactionsByDate as InteractionDateGroup[]"
        SidebarGroup
        SidebarGroupLabel
        SidebarGroupContent
        SidebarMenu
        SidebarMenuItem
        SidebarMenuButton

        <RouterLink class="whitespace-nowrap text-ellipsis overflow-hidden" :to="i.datum.documentId">
          {{ i.datum.job_title }}
        </RouterLink>
        -->

      </SidebarContent>
      <SidebarFooter class="border-t-1 border-t-border w-full h-[var(--app-footer-height)] flex flex-row justify-between items-center">
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

</template>
<style>
[data-slot="sidebar"] {
  border: none !important;
}
</style>