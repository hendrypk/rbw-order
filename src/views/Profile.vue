<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axios'

const router = useRouter()

const customer = ref({
  name: 'Memuat...',
  phone: 'Memuat...',
  email: 'Memuat...'
})

const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await axios.get('/profile')
    if (response.data && response.data.data) {
      customer.value = response.data.data
    }
  } catch (error) {
    console.error('Gagal memuat profil:', error)
    if (error.response && error.response.status === 401) {
      router.push({ name: 'login' })
    }
  } finally {
    isLoading.value = false
  }
})

const handleLogout = async () => {
  try {
    await axios.post('/logout')
  } catch (error) {
    if (error.response && error.response.status !== 401) {
      console.error('Gagal logout:', error)
    }
  } finally {
    router.push({ name: 'login' })
  }
}
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        
        <main class="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scroll-smooth">
            <h1 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Profil Pengguna</h1>

            <div class="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-4 flex items-center space-x-4 border border-gray-100 dark:border-gray-800 transition-colors">
                <div class="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    👑
                </div>
                <div class="min-w-0 flex-1">
                    <h2 class="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {{ customer.name || 'Pelanggan Setia' }}
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {{ customer.email || '-' }}
                    </p>
                    <p class="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        {{ customer.phone || customer.whatsapp || '-' }}
                    </p>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-900 shadow-sm rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
<div @click="router.push({ name: 'orders' })" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between">
        <span>Riwayat Pesanan</span>
        <span class="text-gray-400">›</span>
    </div>
                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition">Voucher</div>
                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition">Poin</div>
                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition">Pengaturan Alamat</div>
                <div @click="handleLogout" class="p-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer font-semibold text-xs transition">Keluar (Logout)</div>
            </div>
        </main>

    </div>
</template>