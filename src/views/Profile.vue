<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axios'

const router = useRouter()

const appVersion = ref('...')

const customer = ref({
  name: 'Memuat...',
  phone: 'Memuat...',
  email: 'Memuat...',
  total_points: 0 
})

const isLoading = ref(true)

onMounted(async () => {
  try {
    // 1. Ambil versi aplikasi dari version.json di server
    const versionRes = await fetch(`/version.json?t=${new Date().getTime()}`, { cache: 'no-store' });
    const versionData = await versionRes.json();
    if (versionData.version) {
      appVersion.value = versionData.version;
    }

    // 2. Ambil data profil utama
    const profileResponse = await axios.get('/profile')
    if (profileResponse.data && profileResponse.data.data) {
      customer.value = { ...customer.value, ...profileResponse.data.data }
    }

    // 3. Ambil data poin secara spesifik dari endpoint loyalty-profile
    const loyaltyResponse = await axios.get('/loyalty-profile')
    if (loyaltyResponse.data && loyaltyResponse.data.data) {
      customer.value.total_points = loyaltyResponse.data.data.total_points || 0
    }

  } catch (error) {
    console.error('Gagal memuat profil atau poin:', error)
    if (error.response && error.response.status === 401) {
      router.push({ name: 'login' })
    }
  } finally {
    isLoading.value = false
  }
})

onMounted(async () => {
  try {
    // 1. Ambil data profil utama
    const profileResponse = await axios.get('/profile')
    if (profileResponse.data && profileResponse.data.data) {
      customer.value = { ...customer.value, ...profileResponse.data.data }
    }

    // 2. Ambil data poin secara spesifik dari endpoint loyalty-profile
    const loyaltyResponse = await axios.get('/loyalty-profile')
    if (loyaltyResponse.data && loyaltyResponse.data.data) {
      customer.value.total_points = loyaltyResponse.data.data.total_points || 0
    }

  } catch (error) {
    console.error('Gagal memuat profil atau poin:', error)
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
        
        <main class="flex-1 overflow-y-auto p-4 space-y-5 pb-24 scroll-smooth">
            <!-- <h1 class="text-xl font-black text-gray-900 dark:text-white tracking-tight">Profil Pengguna</h1> -->

            <!-- Informasi Profil Utama -->
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
                        {{ customer.phone || '-' }}
                    </p>
                </div>
            </div>

            <!-- KARTU AKUMULASI POIN (Mengambil dari endpoint loyalty-profile) -->
            <div class="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
                <div class="space-y-0.5">
                    <span class="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Poin Loyalitas Anda</span>
                    <span class="text-2xl font-black font-mono tracking-tight">{{ Number(customer.total_points || 0).toLocaleString('id-ID') }} Poin</span>
                </div>
                <div class="w-10 h-10 bg-white/20 backdrop-blur-xs rounded-xl flex items-center justify-center text-lg">
                    🎁
                </div>
            </div>

            <!-- Menu Navigasi Profil -->
            <div class="bg-white dark:bg-gray-900 shadow-sm rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
                
                <div @click="router.push({ name: 'orders' })" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between">
                    <span>Riwayat Pesanan</span>
                    <span class="text-gray-400">›</span>
                </div>

                <div @click="router.push({ name: 'vouchers' })" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between">
                    <span>Voucher Saya & Penukaran Poin</span>
                    <span class="text-gray-400">›</span>
                </div>

                <div @click="router.push({ name: 'points-history' })" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between">
                    <span>Riwayat Poin</span>
                    <span class="text-gray-400">›</span>
                </div>

                <div @click="router.push({ name: 'addresses' })" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between">
                    <span>Pengaturan Alamat</span>
                    <span class="text-gray-400">›</span>
                </div>

                <a href="https://wa.me/6285814973157?text=Halo%2C%20saya%20butuh%20bantuan%20terkait%20aplikasi%20Roti%20Bakar%20Wisuda." target="_blank" rel="noopener noreferrer" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-200 transition flex items-center justify-between no-underline">
                    <span class="flex items-center gap-2">
                        <span>Butuh Bantuan?</span>
                    </span>
                    <span class="text-emerald-500 font-bold">💬</span>
                </a>

                <div @click="handleLogout" class="p-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer font-semibold text-xs transition flex items-center justify-between">
                    <span>Keluar</span>
                    <span>🚪</span>
                </div>

            </div>
            <div class="text-center pt-2 pb-4 space-y-1">
                <p class="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    &copy; 2026 All Rights Reserved | Roti Bakar Wisuda
                </p>
                <p class="text-[10px] text-gray-300 dark:text-gray-600">
                    Dikelola secara mandiri
                </p>
                <p class="text-[10px] text-gray-300 dark:text-gray-600">
                    v{{ appVersion }}
                </p>
            </div>
        </main>

    </div>
</template>