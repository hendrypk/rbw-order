<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ThemeToggle from '@/components/ThemeToggle.vue';

const route = useRoute();
const router = useRouter();

const isCatalogPage = computed(() => route.name === 'catalog');

const pageTitle = computed(() => {
    switch (route.name) {
        case 'checkout':
            return 'Konfirmasi Pesanan';
        case 'profile':
            return 'Profil Pengguna';
        case 'qris':
            return 'Pembayaran QRIS';
        default:
            return 'Roti Bakar Wisuda';
    }
});
</script>

<template>
    <!-- Tambahkan v-if agar header TIDAK MUNCUL di halaman qris-payment -->
    <header v-if="route.name !== 'qris-payment'" class="sticky top-0 bg-white/80 dark:bg-gray-900/85 backdrop-blur-md z-40 border-b border-gray-100 dark:border-gray-800 transition-all shrink-0">
        <div v-if="!isCatalogPage" class="px-4 py-3 flex items-center justify-between max-w-md mx-auto">
            <button @click="router.back()" class="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 transition active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div class="flex flex-col items-center">
                <span class="text-[10px] font-bold uppercase tracking-widest text-orange-500">Official Store</span>
                <h1 class="text-xs font-black text-gray-900 dark:text-white tracking-tight">{{ pageTitle }}</h1>
            </div>

            <ThemeToggle />
        </div>
    </header>
</template>