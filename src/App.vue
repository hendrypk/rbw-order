<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()

const hideHeader = computed(() => {
  return ['login', 'register'].includes(route.name)
})
</script>

<template>
  <div class="h-dvh w-screen bg-white flex flex-col relative overflow-hidden">
    
    <AppHeader v-if="!hideHeader" />

    <main class="flex-1 overflow-y-auto pb-24 bg-gray-50/50 scroll-smooth">
      <router-view />
    </main>


  </div>
</template>