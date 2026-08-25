<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()

const hideHeader = computed(() => {
  return ['login', 'register'].includes(route.name)
})

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  }
})
</script>

<template>
  <div class="min-h-dvh w-screen bg-white dark:bg-gray-950 flex flex-col relative transition-colors duration-300">
    
    <AppHeader v-if="!hideHeader" />

    <main class="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 scroll-smooth">
      <router-view />
    </main>

  </div>
</template>