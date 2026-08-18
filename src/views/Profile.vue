<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/axios'

const router = useRouter()

// State untuk menyimpan data profil customer
const customer = ref({
  name: 'Memuat...',
  phone: 'Memuat...',
  email: 'Memuat...'
})

const isLoading = ref(true)

// Ambil data profil dari backend saat halaman dibuka
onMounted(async () => {
  try {
    const response = await axios.get('/profile')
    // Sesuai format controller backend: { status: 'success', data: { ...user } }
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
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Profil Pengguna</h1>

    <!-- Kartu Informasi Customer -->
    <div class="bg-white shadow rounded-2xl p-4 mb-6 flex items-center space-x-4 border border-gray-100">
      <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
        👑
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-bold text-gray-900 truncate">
          {{ customer.name || 'Pelanggan Setia' }}
        </h2>
        <p class="text-xs text-gray-500 truncate mt-0.5">
          {{ customer.email || '-' }}
        </p>
        <p class="text-xs text-amber-600 font-semibold mt-1">
          {{ customer.phone || customer.whatsapp || '-' }}
        </p>
      </div>
    </div>

    <!-- Menu List -->
    <div class="bg-white shadow rounded-2xl divide-y divide-gray-100 overflow-hidden border border-gray-100">
      <div class="p-4 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 transition">Riwayat Pesanan</div>
      <div class="p-4 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 transition">Pengaturan Alamat</div>
      <div @click="handleLogout" class="p-4 text-red-600 hover:bg-red-50 cursor-pointer font-semibold text-sm transition">Keluar (Logout)</div>
    </div>
  </div>
</template>