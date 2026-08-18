<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue'

const route = useRoute()

// Sembunyikan bottom navbar di halaman tertentu agar fokus (misal: saat proses checkout/login)
const hideNavbar = computed(() => {
  // Kamu bisa menambahkan 'cart' ke sini jika ingin halaman keranjang tampil full-screen tanpa navbar bawah
  return ['login', 'register'].includes(route.name)
})
</script>

<template>
  <!-- Container utama ala PWA: Max-width untuk desktop, full height di HP, dengan border subtle di layar besar -->
  <div class="h-dvh w-full max-w-md mx-auto bg-gray-50 flex flex-col relative overflow-hidden shadow-2xl sm:border-x sm:border-gray-200">
    
    <!-- Main Content View -->
    <!-- Tambahkan pb-safe area jika aplikasi dibuka di iPhone notch -->
    <main class="flex-1 overflow-y-auto pb-20 bg-white scroll-smooth">
      <router-view />
    </main>

    <!-- PWA Install Pop-up Banner -->
    <PwaInstallPrompt />

  </div>
</template>