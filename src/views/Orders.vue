<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '@/axios';

const router = useRouter();
const orders = ref([]);
const loading = ref(true);
const errorMessage = ref('');

const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'paid':
        case 'success':
            return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20';
        case 'pending':
            return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20';
        case 'cancelled':
            return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
        default:
            return 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
};

const fetchOrders = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';
        
        // Sesuaikan dengan prefix rute backend: /v1/user/my-orders
        const response = await api.get('/v1/user/my-orders'); 
        
        if (response.data && response.data.data) {
            orders.value = response.data.data;
        } else if (Array.isArray(response.data)) {
            orders.value = response.data;
        }
    } catch (error) {
        console.error('Gagal memuat riwayat pesanan:', error);
        errorMessage.value = error.response?.data?.message || 'Gagal memuat riwayat pesanan dari server.';
    } finally {
        loading.value = false;
    }
};
onMounted(() => {
    fetchOrders();
});
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        
        <main class="main-scroll-container flex-1 overflow-y-auto p-4 space-y-4 pb-24 scroll-smooth">

            <div v-if="loading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-xs font-medium">
                Memuat riwayat pesananmu... 📦
            </div>

            <div v-else-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-2xl text-center font-medium border border-red-200/50 dark:border-red-500/20">
                {{ errorMessage }}
            </div>

            <div v-else-if="orders.length === 0" class="text-center py-16 space-y-2">
                <div class="text-4xl">🧾</div>
                <p class="text-xs font-bold text-gray-700 dark:text-gray-300">Belum ada riwayat pesanan</p>
                <p class="text-[11px] text-gray-400 dark:text-gray-500">Yuk, mulai pesan roti bakar favoritmu sekarang!</p>
            </div>

            <div v-else class="space-y-3">
                <div v-for="order in orders" :key="order.id || order.order_number" class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3 transition-colors">
                    
                    <div class="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-2.5">
                        <div>
                            <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">No. Invoice</p>
                            <h3 class="text-xs font-black text-gray-900 dark:text-white mt-0.5">{{ order.order_number }}</h3>
                        </div>
                        <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider', getStatusBadge(order.status || order.payment_status)]">
                            {{ order.status || order.payment_status || 'Pending' }}
                        </span>
                    </div>

                    <div class="space-y-1 text-xs">
                        <div class="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>Waktu Pesan</span>
                            <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatDate(order.created_at) }}</span>
                        </div>
                        <div class="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>Total Item</span>
                            <span class="font-medium text-gray-700 dark:text-gray-300">{{ order.items?.length || 0 }} Menu</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            <span class="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider block">Total Bayar</span>
                            <span class="text-xs font-black text-orange-600 dark:text-orange-400">Rp {{ formatPrice(order.final_total || order.total_amount) }}</span>
                        </div>

                        <button 
                            @click="router.push({ name: 'qris', query: { order_number: order.order_number, amount: order.final_total || order.total_amount } })" 
                            class="bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-500/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition">
                            Detail / Bayar
                        </button>
                    </div>

                </div>
            </div>
        </main>

    </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>