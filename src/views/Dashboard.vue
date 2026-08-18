<!-- src/views/Dashboard.vue -->
<template>
    <div class="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-24">
        <!-- Native-like Header / Greeting -->
        <header class="bg-amber-600 text-white p-5 rounded-b-3xl shadow-md flex justify-between items-start">
            <div>
                <p class="text-xs text-amber-100 font-medium">Selamat Datang,</p>
                <h1 class="text-lg font-bold mt-0.5">{{ user?.name || 'Pelanggan Setia' }}</h1>
            </div>
            <router-link to="/profile" class="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-amber-500 shadow-inner">
                {{ userInitials }}
            </router-link>
        </header>

        <!-- Main Dashboard Content -->
        <main class="p-4 flex-1 space-y-5 -mt-3">
            <!-- Loyalty Points & Rewards Card -->
            <div class="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-4 rounded-2xl shadow-md relative overflow-hidden flex justify-between items-center">
                <div class="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <div>
                    <span class="text-xs text-amber-100 font-medium uppercase tracking-wider">Total Poin</span>
                    <h2 class="text-2xl font-extrabold mt-0.5">1,250 <span class="text-xs font-normal">Poin</span></h2>
                    <p class="text-[11px] text-amber-100 mt-1">Tukarkan dengan diskon menarik!</p>
                </div>
                <button class="bg-white text-amber-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-50 active:scale-95 transition">
                    Tukar Poin
                </button>
            </div>

            <!-- Quick Navigation Menu / Shortcut -->
            <div class="grid grid-cols-4 gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                <router-link to="/" class="flex flex-col items-center group">
                    <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <span class="text-[11px] font-semibold text-gray-700 mt-1.5">Menu</span>
                </router-link>
                <router-link to="/cart" class="flex flex-col items-center group relative">
                    <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <span class="text-[11px] font-semibold text-gray-700 mt-1.5">Keranjang</span>
                </router-link>
                <router-link to="/orders" class="flex flex-col items-center group">
                    <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <span class="text-[11px] font-semibold text-gray-700 mt-1.5">Pesanan</span>
                </router-link>
                <router-link to="/profile" class="flex flex-col items-center group">
                    <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span class="text-[11px] font-semibold text-gray-700 mt-1.5">Profil</span>
                </router-link>
            </div>

            <!-- Last Order / Riwayat Order Terakhir -->
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-gray-800 text-sm">Riwayat Order Terakhir</h3>
                    <router-link to="/orders" class="text-xs text-amber-600 font-semibold hover:underline">Lihat Semua</router-link>
                </div>

                <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-gray-800">#RBW-89210</span>
                            <span class="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Selesai</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Roti Bakar Special Keju Coklat + Extra Susu</p>
                        <p class="text-xs font-bold text-amber-600 mt-1">Rp 35.000</p>
                    </div>
                    <button class="bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-amber-700 active:scale-95 transition flex-shrink-0">
                        Pesan Lagi
                    </button>
                </div>
            </div>
        </main>

        <!-- Native Bottom Navigation Bar -->
        <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-6 py-2.5 flex justify-between items-center z-20 shadow-lg">
            <router-link to="/dashboard" class="flex flex-col items-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                <span class="text-[10px] font-bold mt-0.5">Home</span>
            </router-link>
            <router-link to="/" class="flex flex-col items-center text-gray-400 hover:text-amber-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span class="text-[10px] font-medium mt-0.5">Katalog</span>
            </router-link>
            <router-link to="/cart" class="flex flex-col items-center text-gray-400 hover:text-amber-600 transition relative">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span class="text-[10px] font-medium mt-0.5">Keranjang</span>
            </router-link>
            <router-link to="/profile" class="flex flex-col items-center text-gray-400 hover:text-amber-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span class="text-[10px] font-medium mt-0.5">Profil</span>
            </router-link>
        </nav>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const user = ref({ name: 'Budi Santoso' })

const userInitials = computed(() => {
    if (!user.value?.name) return 'US'
    const parts = user.value.name.split(' ')
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return user.value.name.substring(0, 2).toUpperCase()
})
</script>