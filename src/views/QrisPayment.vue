<!-- src/views/QrisPayment.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/axios';

const route = useRoute();
const router = useRouter();

const orderNumber = ref(route.query.order_number || '');
const amount = ref(route.query.amount || 0);
const qrisData = ref(null);
const loading = ref(true);
const checking = ref(false);
const errorMessage = ref('');

const showModal = ref(false);
const modalStatus = ref('pending');
const modalMessage = ref('');

const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

const generateQris = async () => {
    if (!orderNumber.value) {
        errorMessage.value = 'Nomor pesanan tidak ditemukan.';
        loading.value = false;
        return;
    }

    try {
        const response = await axios.post('/payment/qris/generate', {
            order_number: orderNumber.value,
            amount: Number(amount.value)
        });
        
        qrisData.value = response.data.data || response.data;
    } catch (err) {
        console.error('Gagal generate QRIS:', err.response?.data || err);
        errorMessage.value = err.response?.data?.message || 'Gagal memuat kode QRIS dari server.';
    } finally {
        loading.value = false;
    }
};

const checkStatus = async () => {
    checking.value = true;
    try {
        const response = await axios.post('/payment/qris/check-status', {
            order_number: orderNumber.value
        });

        const status = response.data.status || response.data.payment_status;
        
        if (status === 'completed' || status === 'paid' || response.data.paid) {
            modalStatus.value = 'success';
            modalMessage.value = 'Pembayaran berhasil dikonfirmasi! Pesananmu sedang diproses.';
            showModal.value = true;
        } else {
            modalStatus.value = 'pending';
            modalMessage.value = 'Pembayaran belum terdeteksi. Silakan selesaikan pembayaran terlebih dahulu.';
            showModal.value = true;
        }
    } catch (e) {
        modalStatus.value = 'error';
        modalMessage.value = 'Gagal mengecek status pembayaran. Coba beberapa saat lagi.';
        showModal.value = true;
    } finally {
        checking.value = false;
    }
};

const handleModalAction = () => {
    const isSuccess = modalStatus.value === 'success';
    showModal.value = false;
    if (isSuccess) {
        router.push({
            name: 'order-detail',
            params: { order_number: orderNumber.value }
        });
    }
};

onMounted(() => {
    generateQris();
});
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col justify-between p-4 overflow-hidden transition-colors duration-300 relative">
        <main class="main-scroll-container flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth">
            <div>
                <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center space-y-4 transition-colors">
                    <div>
                        <p class="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">Total Tagihan</p>
                        <p class="text-2xl font-extrabold text-[#ff5722] mt-1">Rp {{ formatPrice(amount) }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Invoice: <span class="font-bold text-gray-800 dark:text-gray-200">{{ orderNumber }}</span></p>
                    </div>

                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-center items-center my-4 transition-colors">
                        <div v-if="loading" class="py-16 text-xs text-gray-400 dark:text-gray-500 animate-pulse">
                            Memuat QRIS...
                        </div>
                        <div v-else-if="errorMessage" class="py-10 text-xs text-red-500 dark:text-red-400">
                            {{ errorMessage }}
                        </div>
                        <img 
                            v-else 
                            :src="qrisData?.qr_image || qrisData?.qris_url || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + orderNumber" 
                            alt="QRIS Code" 
                            class="w-56 h-56 object-contain mx-auto bg-white p-2 rounded-xl" 
                        />
                    </div>

                    <div class="text-left bg-orange-50/60 dark:bg-orange-500/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-[11px] text-gray-600 dark:text-gray-300 space-y-1 transition-colors">
                        <p class="font-bold text-orange-800 dark:text-orange-400">Cara Pembayaran:</p>
                        <p>1. Buka aplikasi M-Banking atau E-Wallet (BCA, GoPay, OVO, DANA, dll).</p>
                        <p>2. Pilih menu <b>Scan QR / QRIS</b>.</p>
                        <p>3. Arahkan kamera ke kode QR di atas lalu konfirmasi pembayaran.</p>
                    </div>
                </div>
            </div>
        </main>

        <div class="space-y-2.5 pt-4 shrink-0 bg-gray-50 dark:bg-gray-950 transition-colors">
            <button 
                @click="checkStatus" 
                :disabled="checking"
                class="w-full bg-[#ff5722] hover:bg-[#f4511e] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50">
                {{ checking ? 'Mengecek...' : 'Cek Status Pembayaran' }}
            </button>
            <button 
                @click="router.push('/')" 
                class="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 py-3 rounded-2xl font-semibold text-xs transition">
                Kembali ke Menu Utama
            </button>
        </div>

        <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-200">
                
                <div class="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl" :class="{
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400': modalStatus === 'success',
                    'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400': modalStatus === 'pending',
                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400': modalStatus === 'error'
                }">
                    <span v-if="modalStatus === 'success'">🎉</span>
                    <span v-else-if="modalStatus === 'pending'">⏳</span>
                    <span v-else>⚠️</span>
                </div>

                <div>
                    <h3 class="text-sm font-extrabold text-gray-900 dark:text-white">
                        {{ modalStatus === 'success' ? 'Hore, Berhasil!' : modalStatus === 'pending' ? 'Belum Lunas' : 'Ups, Ada Kendala' }}
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {{ modalMessage }}
                    </p>
                </div>

                <button 
                    @click="handleModalAction"
                    class="w-full py-3 rounded-xl font-bold text-xs text-white shadow-md transition active:scale-95"
                    :class="{
                        'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20': modalStatus === 'success',
                        'bg-[#ff5722] hover:bg-[#f4511e] shadow-orange-500/20': modalStatus !== 'success'
                    }">
                    {{ modalStatus === 'success' ? 'Lihat Pesanan' : 'Oke, Mengerti' }}
                </button>
            </div>
        </div>
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