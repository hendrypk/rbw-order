<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' 
import api from '@/axios' 

const router = useRouter()
const name = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const handleRegister = async () => {
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi password tidak cocok.'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

    await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
        withCredentials: true
    })

    await api.post('/register', {
      name: name.value,
      phone: phone.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value
    })

    localStorage.setItem('isLoggedIn', 'true')

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
  <div class="flex flex-col justify-center px-6 py-8 h-dvh w-screen bg-white max-w-md mx-auto overflow-y-auto">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm mb-4">
      <h2 class="text-center text-2xl font-bold tracking-tight text-gray-900">Buat Akun Baru</h2>
      <p class="text-center text-sm text-gray-600 mt-1">Nikmati kemudahan pesan Roti Bakar Wisuda</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <div v-if="errorMessage" class="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">Nama Lengkap</label>
          <input type="text" v-model="name" required class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="Nama Anda" />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">No. WhatsApp / Telepon</label>
          <input type="tel" v-model="phone" required class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="08xxxxxxxxxx" />
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">Email</label>
          <input type="email" v-model="email" required class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="nama@email.com" />
        </div>

        <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Password</label>
            <div class="relative flex items-center">
                <input 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="password" 
                    required 
                    class="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" 
                    placeholder="••••••••" 
                />
                
                <button 
                    type="button" 
                    @click="showPassword = !showPassword" 
                    class="absolute right-3.5 text-gray-400 hover:text-gray-700 transition focus:outline-none p-1"
                >
                    <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>

                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                </button>
            </div>
        </div>

        <div>
            <label class="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">Konfirmasi Password</label>
            <div class="relative flex items-center">
                <input 
                    :type="showPasswordConfirmation ? 'text' : 'password'" 
                    v-model="passwordConfirmation" 
                    required 
                    class="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" 
                    placeholder="••••••••" 
                />
                
                <button 
                    type="button" 
                    @click="showPasswordConfirmation = !showPasswordConfirmation" 
                    class="absolute right-3.5 text-gray-400 hover:text-gray-700 transition focus:outline-none p-1"
                >
                    <svg v-if="showPasswordConfirmation" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>

                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                </button>
            </div>
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition shadow-md shadow-amber-600/20 disabled:opacity-50 mt-1">
          {{ isLoading ? 'Memproses...' : 'Daftar Sekarang' }}
        </button>
      </form>

      <p class="mt-4 text-center text-xs text-gray-500">
        Sudah punya akun? 
        <router-link to="/login" class="font-semibold text-amber-600 hover:text-amber-500">Masuk di sini</router-link>
      </p>
    </div>
  </div>
</template>