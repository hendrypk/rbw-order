<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/axios'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const loginInput = ref('') 
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const showPassword = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await api.get(`${backendUrl}/sanctum/csrf-cookie`)

    const response = await api.post('/login', {
      login: loginInput.value,
      password: password.value
    })

    if (response.data && response.data.data && response.data.data.customer) {
      localStorage.setItem('customer_data', JSON.stringify(response.data.data.customer))
    }
    
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
  <div class="flex flex-col justify-center px-6 py-8 h-dvh w-screen bg-white dark:bg-gray-950 max-w-md mx-auto overflow-y-auto transition-colors duration-300 relative">
    
    <div class="absolute top-6 right-6">
      <ThemeToggle />
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-sm mb-6">
      <h2 class="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Roti Bakar Wisuda</h2>
      <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">Silakan masuk untuk melanjutkan pesanan</p>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl text-center">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Email / No. WhatsApp</label>
          <input type="text" v-model="loginInput" required class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" placeholder="nama@email.com atau 08xx" />
        </div>

        <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Password</label>
            <div class="relative flex items-center">
                <input 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="password" 
                    required 
                    class="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" 
                    placeholder="••••••••" 
                />
                
                <button 
                    type="button" 
                    @click="showPassword = !showPassword" 
                    class="absolute right-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition focus:outline-none p-1"
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

        <button type="submit" :disabled="isLoading" class="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition shadow-md shadow-amber-600/20 disabled:opacity-50 mt-2">
          {{ isLoading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Belum punya akun? 
        <router-link to="/register" class="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500">Daftar di sini</router-link>
      </p>
    </div>

    <!-- Floating WhatsApp Button -->
    <a 
      href="https://wa.me/6285814973157?text=Halo%20Admin,%20saya%20mengalami%20kendala%20saat%20login%20ke%20RPW%20App." 
      target="_blank" 
      class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95 group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span class="text-xs font-semibold tracking-wide">Kendala Login?</span>
    </a>

  </div>
</template>