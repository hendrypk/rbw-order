<script setup>
import { ref, onMounted, computed } from 'vue';
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

// Fungsi format tanggal/waktu agar rapi
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Computed untuk mendeteksi poin dari transaksi ini (berdasarkan relasi points / customer_points)
const transactionPoint = computed(() => {
    if (!order.value || !order.value.points) return null;
    // Jika points berupa array atau relasi hasMany / hasOne
    return Array.isArray(order.value.points) ? order.value.points[0] : order.value.points;
});

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

const orderItemSummary = computed(() => {
    if (!order.value || !order.value.items) return '-';
    return order.value.items
        .map(item => `${item.menu?.name || 'Menu'} (x${item.quantity})`)
        .join(', ');
});

onMounted(() => {
    fetchOrderDetail();
});
</script>
<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        <main class="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
            
            <div v-if="loading" class="text-center py-16 text-xs text-gray-400">
                Memuat detail pesanan...
            </div>

            <div v-else-if="errorMessage" class="p-4 bg-red-50 text-red-600 text-xs rounded-2xl text-center">
                {{ errorMessage }}
            </div>

            <div v-else-if="order" class="space-y-4">
                <!-- Info Status & Waktu Pembayaran -->
                <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-2.5">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">No. Invoice</span>
                        <span class="text-xs font-black text-gray-900 dark:text-white">{{ order.order_number }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">Status</span>
                        <span class="text-xs font-bold uppercase px-2.5 py-1 rounded-full" :class="order.status === 'paid' || order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                            {{ order.status }}
                        </span>
                    </div>
                    
                    <!-- Ditampilkan jika pesanan sudah lunas dan ada data waktu pembayarannya -->
                    <div v-if="(order.status === 'paid' || order.status === 'completed') && (order.paid_at || order.updated_at)" class="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800 text-xs">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">Dibayar Pada</span>
                        <span class="text-gray-600 dark:text-gray-300 font-medium">{{ formatDate(order.paid_at || order.updated_at) }}</span>
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

                <!-- Rincian Harga & Voucher Applied -->
                <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                    <div class="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Subtotal</span>
                        <span class="font-mono">Rp {{ formatPrice(order.subtotal) }}</span>
                    </div>

                    <!-- Diskon Voucher -->
                    <div v-if="order.voucher_id || (order.discount && order.discount > 0)" class="flex justify-between text-gray-500 dark:text-gray-400 font-light">
                        <span>Diskon Voucher {{ order.voucher?.code ? '(' + order.voucher.code + ')' : '' }}</span>
                        <span class="font-mono">- Rp {{ formatPrice(order.discount) }}</span>
                    </div>

                    <div class="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800 text-sm font-black text-gray-900 dark:text-white">
                        <span>Total Pembayaran</span>
                        <span class="font-mono text-[#ff5722]">Rp {{ formatPrice(order.final_total) }}</span>
                    </div>

                    <!-- 🎁 INFORMASI POIN DARI TRANSAKSI (Hanya muncul jika pesanan lunas dan ada record poin) -->
                    <div v-if="(order.status === 'paid' || order.status === 'completed') && transactionPoint" class="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800">
                        <div v-if="transactionPoint.type === 'earned' && transactionPoint.points > 0" class="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-between font-semibold">
                            <span>✨ Poin Didapat</span>
                            <span class="font-mono font-bold">+{{ transactionPoint.points }} Poin</span>
                        </div>
                        <div v-else-if="transactionPoint.type === 'redeemed' && transactionPoint.points < 0" class="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 rounded-xl flex items-center justify-between font-semibold">
                            <span>🎁 Poin Digunakan</span>
                            <span class="font-mono font-bold">{{ transactionPoint.points }} Poin</span>
                        </div>
                    </div>
                </div>

                <!-- Bagian Tombol Aksi Berdasarkan Status -->
                <div class="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 space-y-2">
                    
                    <!-- Kondisi 1: Jika Unpaid -->
                    <template v-if="order.status === 'unpaid'">
                        <button 
                            @click="goToPayment"
                            class="w-full bg-[#ff5722] hover:bg-[#f4511e] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer">
                            Lanjut ke Pembayaran QRIS
                        </button>

                        <a 
                            :href="`https://wa.me/6285814973157?text=${encodeURIComponent('Halo Admin, saya mengalami kendala pada pembayaran pesanan saya.\n\nNo. Order: ' + (order.order_number || '-') + '\nTotal: Rp ' + formatPrice(order.final_total))}`" 
                            target="_blank" 
                            class="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 text-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            Lapor Kendala Pembayaran
                        </a>
                    </template>

                    <!-- Kondisi 2: Jika Completed -->
                    <template v-else-if="order.status === 'paid' || order.status === 'completed'">
                        <a 
                            :href="`https://wa.me/6285814973157?text=${encodeURIComponent('Halo Admin, saya ingin mengonfirmasi pesanan saya.\n\nNo. Order: ' + (order.order_number || '-') + '\nDetail: ' + (orderItemSummary || '-') + '\nWaktu: ' + (order.schedule || 'Sekarang'))}`" 
                            target="_blank" 
                            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 text-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            Konfirmasi Pesanan ke Admin
                        </a>
                    </template>
                </div>
            </div>

        </main>
    </div>
</template>