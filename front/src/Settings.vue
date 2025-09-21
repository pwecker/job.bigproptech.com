<script setup lang="ts">

import { ref } from 'vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
const [UseTemplate, SettingsBody] = createReusableTemplate()
const isDialog = useMediaQuery('(min-width: 768px)')
const isOpen = ref(false)

// dark mode toggle
import { useUXStore } from '@/stores/ux'
const uxStore = useUXStore()
const { toggleDark } = uxStore

import { Categories, getTagData } from '@/composables/useTagApi'
const { data, loading, error } = getTagData('grouped')

import { computed } from 'vue'

const badges = computed(() =>
  Object.entries(data.value ?? {}).map(([category, values]) =>
    values.map((value) => ({ category: category as Categories, value }))
  )
);

// components
import { ScrollArea } from '@/components/ui/scroll-area'

import CategoryBadges from '@/components/Categories.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Settings, Sun, Moon } from 'lucide-vue-next'
import LoadingElement from '@/components/Loading.vue'
</script>
<template>
  <UseTemplate>
    <Tabs default-value="filters" class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="filters">
          Filters
        </TabsTrigger>
        <TabsTrigger value="account">
          Account
        </TabsTrigger>
      </TabsList>
      <TabsContent value="filters">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Make changes to your filters here. Click apply when you're done.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <ScrollArea class="h-[35vh]">
              <div v-if="loading"><LoadingElement /></div>
              <div v-else class="flex flex-col gap-4">
                <div v-for="(group, groupIndex) in badges">
                  <fieldset class="border-1 rounded-md p-2 flex flex-wrap gap-1.5">
                    <legend class="text-xs">{{ group[0].category }}</legend>
                    <CategoryBadges :categoryBadges="group"/>
                  </fieldset>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button>Apply</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="account">
        <Card>
          <!-- <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Change your settings here. Click apply when you're done.
            </CardDescription>
          </CardHeader> -->
          <CardContent class="space-y-2">
            <Button
              class="cursor-pointer"
              variant="outline"
              @click="toggleDark()"
              size="icon"
            >
              <Moon class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Sun class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
            </Button>
          </CardContent>
          <!-- <CardFooter>
            <Button>Apply</Button>
          </CardFooter> -->
        </Card>
      </TabsContent>
    </Tabs>
  </UseTemplate>

  <Dialog v-if="isDialog" v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" size="icon" @click="$event.currentTarget.blur()">
        <Settings class="dark:text-stone-300 text-stone-950" :size="10"/>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px] lg:max-w-[800px] h-[72vh]">
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>
          <SettingsBody />
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>

  <Drawer :direction="'top'" v-else v-model:open="isOpen">
    <DrawerTrigger as-child>
      <Button variant="outline" size="icon" @click="$event.currentTarget.blur()">
        <Settings />
      </Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader class="text-left">
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerDescription>
          <SettingsBody />
        </DrawerDescription>
      </DrawerHeader>
      <DrawerFooter class="pt-2">
        <DrawerClose as-child>
          <Button variant="outline">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>