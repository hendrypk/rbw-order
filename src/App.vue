<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()

const hideHeader = computed(() => {
  return ['login', 'register'].includes(route.name)
})

const isUpdatingVersion = ref(false);
const currentVersion = '1.0.1'; // Sesuaikan dengan versi aplikasi Anda saat ini

const checkForUpdates = async () => {
    try {
        const response = await fetch(`/version.json?t=${new Date().getTime()}`);
        const data = await response.json();
        
        if (data.version && data.version !== currentVersion) {
            // Tampilkan modal downloading / updating
            isUpdatingVersion.value = true;
            
            // Beri jeda 1.5 detik agar animasi/modal terlihat natural oleh pengguna
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 1. Hapus semua Cache Storage
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 2. Unregister Service Worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }

            // 3. Reload paksa aplikasi
            window.location.reload(true);
        }
    } catch (error) {
        console.error('Gagal mengecek pembaruan aplikasi:', error);
    }
};

onMounted(() => {
  checkForUpdates();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            checkForUpdates();
        }
    });
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
    <div v-if="isUpdatingVersion" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-200">
            
            <!-- Animasi Icon Download / Mutar -->
            <div class="w-16 h-16 mx-auto rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-3xl text-orange-500 animate-bounce">
                📥
            </div>

            <div class="space-y-1">
                <h3 class="text-sm font-extrabold text-gray-900 dark:text-white">
                    Memperbarui Aplikasi...
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Versi terbaru ditemukan. Sedang mengunduh dan memperbarui sistem, mohon tunggu sebentar.
                </p>
            </div>

            <!-- Progress bar animasi loading -->
            <div class="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div class="bg-orange-500 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
        </div>
    </div>
  </div>
</template>