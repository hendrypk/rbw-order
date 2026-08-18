<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/axios'

const router = useRouter()
const name = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi password tidak cocok.'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    // 1. Ambil CSRF cookie dari root backend Laravel terlebih dahulu
    await api.get('/sanctum/csrf-cookie')

    // 2. Request register ke backend (session login otomatis tercipta jika backend mengaturnya)
    await api.post('/register', {
      name: name.value,
      phone: phone.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value
    })

    // 3. Karena murni pakai cookie, tidak perlu localStorage. 
    // Langsung arahkan ke halaman katalog/dashboard.
    router.push({ name: 'catalog' })

  } catch (err) {
    if (err.response && err.response.data) {
      const data = err.response.data
      if (data.errors) {
        const firstKey = Object.keys(data.errors)[0]
        errorMessage.value = data.errors[firstKey][0]
      } else {
        errorMessage.value = data.message || 'Registrasi gagal, silahkan coba lagi.'
      }
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
      <h2 class="text-center text-2xl font-bold tracking-tight text-gray-900">Buat Akun Baru</h2>
      <p class="text-center text-sm text-gray-600 mt-1">Nikmati kemudahan pesan Roti Bakar Wisuda</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <!-- Error Banner -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nama Lengkap</label>
          <input type="text" v-model="name" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="Nama Anda" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">No. WhatsApp / Telepon</label>
          <input type="tel" v-model="phone" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="08xxxxxxxxxx" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
          <input type="email" v-model="email" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="nama@email.com" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
          <input type="password" v-model="password" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="••••••••" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Konfirmasi Password</label>
          <input type="password" v-model="passwordConfirmation" required class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition shadow-md shadow-amber-600/20 disabled:opacity-50 mt-2">
          {{ isLoading ? 'Memproses...' : 'Daftar Sekarang' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500">
        Sudah punya akun? 
        <router-link to="/login" class="font-semibold text-amber-600 hover:text-amber-500">Masuk di sini</router-link>
      </p>
    </div>
  </div>
</template>