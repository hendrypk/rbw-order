<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'

const route = useRoute()

const hideNavbar = computed(() => {
  return ['login', 'register'].includes(route.name)
})
</script>

<template>
  <div class="h-dvh w-screen bg-white flex flex-col relative overflow-hidden">
    
    <main class="flex-1 overflow-y-auto pb-20 bg-white scroll-smooth">
      <router-view />
    </main>

    <PwaInstallPrompt />

  </div>
</template>