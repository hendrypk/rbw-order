<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isCatalogPage = computed(() => route.name === 'catalog');
</script>

<template>
    <header class="sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100/80 shrink-0">
        <div v-if="!isCatalogPage" class="px-4 py-3 flex items-center justify-between max-w-md mx-auto">
            <button @click="router.back()" class="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div class="flex flex-col items-center">
                <span class="text-[10px] font-bold uppercase tracking-widest text-orange-500">Official Store</span>
                <h1 class="text-xs font-black text-gray-900 tracking-tight">Roti Bakar Wisuda</h1>
            </div>

            <div class="w-9"></div> 
        </div>
    </header>
</template>