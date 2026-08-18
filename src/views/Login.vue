<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/axios' // Menggunakan instance axios yang sudah dikonfigurasi withCredentials: true

const router = useRouter()
const loginInput = ref('') // Bisa diisi email atau nomor HP
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    // 1. Ambil CSRF Cookie dari root backend Laravel
    await api.get(`${backendUrl}/sanctum/csrf-cookie`,)

    // 2. Request login ke backend menggunakan key 'login' (email/phone) dan 'password'
    const response = await api.post('/login', {
      login: loginInput.value,
      password: password.value
    })

    // --- TAMBAHKAN KODE INI ---
    // 3. Simpan data customer ke localStorage agar bisa dipakai di Checkout/Profile tanpa error 401
    if (response.data && response.data.data && response.data.data.customer) {
      localStorage.setItem('customer_data', JSON.stringify(response.data.data.customer))
    }
    // ---------------------------

    // 4. Berhasil login, arahkan ke halaman katalog/dashboard
    router.push({ name: 'catalog' })

  } catch (err) {
    if (err.response && err.response.data) {
      errorMessage.value = err.response.data.message || 'Login gagal, periksa kembali kredensial Anda.'
    } else {
      errorMessage.value = 'Terjadi kesalahan pada jaringan atau server.'
    }
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <div class="flex flex-col justify-center px-6 py-12 min-h-screen bg-white max-w-md mx-auto">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm mb-6">
      <h2 class="text-center text-2xl font-bold tracking-tight text-gray-900">Roti Bakar Wisuda</h2>
      <p class="text-center text-sm text-gray-600 mt-1">Silakan masuk untuk melanjutkan pesanan</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <!-- Error Banner -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email / No. WhatsApp</label>
          <input type="text" v-model="loginInput" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="nama@email.com atau 08xx" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
          <input type="password" v-model="password" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition shadow-md shadow-amber-600/20 disabled:opacity-50 mt-2">
          {{ isLoading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Belum punya akun? 
        <router-link to="/register" class="font-semibold text-amber-600 hover:text-amber-500">Daftar di sini</router-link>
      </p>
    </div>
  </div>
</template>