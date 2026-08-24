<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const deferredPrompt = ref(null)
const showBanner = ref(false)

const handleBeforeInstallPrompt = (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  // Munculkan banner secara elegan karena user sudah dalam kondisi login/aktif
  showBanner.value = true
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

const installPwa = async () => {
  if (!deferredPrompt.value) return

  // Dipicu murni dari klik user, dijamin lolos dari blokir Chrome
  deferredPrompt.value.prompt()

  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    console.log('PWA berhasil diinstal')
  }

  deferredPrompt.value = null
  showBanner.value = false
}

const dismissPrompt = () => {
  showBanner.value = false
}
</script>

<template>
  <transition name="slide-up">
    <!-- Hanya tampil jika event PWA siap dan user sudah login -->
    <div v-if="showBanner" class="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div>
          <h3 class="font-semibold text-gray-900 text-sm">Install Roti Bakar Wisuda</h3>
          <p class="text-xs text-gray-500 mt-0.5">Akses lebih cepat langsung dari layar HP kamu!</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2 shrink-0">
        <button @click="dismissPrompt" class="text-gray-400 hover:text-gray-600 p-1 text-sm font-medium">
          Nanti
        </button>
        <button @click="installPwa" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition">
          Install
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>