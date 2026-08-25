<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';

const route = useRoute();
const router = useRouter();

const orderNumber = route.params.order_number;
const order = ref(null);
const loading = ref(true);
const errorMessage = ref('');

const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

const fetchOrderDetail = async () => {
    try {
        loading.value = true;
        const response = await axios.get(`/my-order/${orderNumber}`);
        order.value = response.data.data || response.data;
    } catch (error) {
        console.error('Gagal memuat detail pesanan:', error);
        errorMessage.value = 'Gagal memuat informasi pesanan.';
    } finally {
        loading.value = false;
    }
};

const goToPayment = () => {
    router.push({
        name: 'qris',
        query: {
            order_number: order.value.order_number,
            amount: order.value.final_total || order.value.total_amount
        }
    });
};

onMounted(() => {
    fetchOrderDetail();
});
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        <main class="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            
            <div v-if="loading" class="text-center py-16 text-xs text-gray-400">
                Memuat detail pesanan...
            </div>

            <div v-else-if="errorMessage" class="p-4 bg-red-50 text-red-600 text-xs rounded-2xl text-center">
                {{ errorMessage }}
            </div>

            <div v-else-if="order" class="space-y-4">
                <!-- Info Status -->
                <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">No. Invoice</span>
                        <span class="text-xs font-black text-gray-900 dark:text-white">{{ order.order_number }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">Status</span>
                        <span class="text-xs font-bold uppercase px-2.5 py-1 rounded-full" :class="order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                            {{ order.status }}
                        </span>
                    </div>
                </div>

                <!-- Daftar Item -->
                <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
                    <h3 class="text-xs font-bold text-gray-500 uppercase">Rincian Menu</h3>
                    <div v-for="item in order.items" :key="item.id" class="flex justify-between text-xs py-1 border-b border-gray-50 dark:border-gray-800 last:border-none">
                        <div>
                            <p class="font-bold text-gray-800 dark:text-gray-200">{{ item.menu?.name || 'Menu' }} (x{{ item.quantity }})</p>
                        </div>
                        <span class="font-semibold text-gray-700 dark:text-gray-300">Rp {{ formatPrice(item.subtotal) }}</span>
                    </div>
                </div>

                <!-- Total & Tombol Bayar (Hanya muncul jika belum lunas) -->
                <div v-if="order.status !== 'paid' && order.status !== 'completed'" class="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
                    <button 
                        @click="goToPayment"
                        class="w-full bg-[#ff5722] hover:bg-[#f4511e] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition">
                        Lanjut ke Pembayaran QRIS
                    </button>
                </div>
            </div>

        </main>
    </div>
</template>