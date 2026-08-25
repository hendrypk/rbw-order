<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

const remainingSeconds = ref(0);
let timerInterval = null;
let pollInterval = null;
const isPaid = ref(false);

const formattedCountdown = computed(() => {
    if (remainingSeconds.value <= 0) return '00:00';
    const minutes = Math.floor(remainingSeconds.value / 60);
    const seconds = remainingSeconds.value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const isExpired = computed(() => remainingSeconds.value <= 0 && qrisData.value !== null);

const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

const qrImageUrl = computed(() => {
    if (!qrisData.value?.qr_content) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrisData.value.qr_content)}`;
});

const startCountdown = (expiryIsoString) => {
    if (!expiryIsoString) return;

    const expiryTime = new Date(expiryIsoString).getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = expiryTime - now;

        if (distance <= 0) {
            remainingSeconds.value = 0;
            if (timerInterval) clearInterval(timerInterval);
        } else {
            remainingSeconds.value = Math.floor(distance / 1000);
        }
    };

    updateTimer();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
};

const generateQris = async () => {
    if (!orderNumber.value) {
        errorMessage.value = 'Nomor pesanan tidak ditemukan.';
        loading.value = false;
        return;
    }

    try {
        const statusRes = await axios.post('/payment/qris/check-status', {
            order_number: orderNumber.value
        });

        if (statusRes.data.paid || statusRes.data.payment_status === 'completed') {
            isPaid.value = true;
            loading.value = false;
            return;
        }
    } catch (e) {
        console.error('Gagal cek status awal:', e);
    }

    const savedQrisKey = `qris_data_${orderNumber.value}`;
    const cachedData = localStorage.getItem(savedQrisKey);

    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const now = new Date().getTime();

        if (parsed.validity_period && new Date(parsed.validity_period).getTime() > now) {
            qrisData.value = parsed;
            startCountdown(parsed.validity_period);
            loading.value = false;
            return; 
        } else {
            localStorage.removeItem(savedQrisKey);
        }
    }
    
    try {
        const response = await axios.post('/payment/qris/generate', {
            order_number: orderNumber.value,
            amount: Number(amount.value)
        });
        
        qrisData.value = response.data.data || response.data;

        const validityPeriod = qrisData.value.validity_period || qrisData.value.validityPeriod;
        qrisData.value.validity_period = validityPeriod;

        localStorage.setItem(savedQrisKey, JSON.stringify(qrisData.value));

        startCountdown(validityPeriod);

    } catch (err) {
        console.error('Gagal generate QRIS:', err.response?.data || err);
        errorMessage.value = err.response?.data?.message || 'Gagal memuat kode QRIS dari server.';
    } finally {
        loading.value = false;
    }
};

const checkStatus = async () => {
    if (checking.value) return; 
    
    checking.value = true;
    try {
        const response = await axios.post('/payment/qris/check-status', {
            order_number: orderNumber.value
        });

        const status = response.data.status || response.data.payment_status;
        
        if (status === 'completed' || status === 'paid' || response.data.paid) {
            isPaid.value = true; 
            localStorage.removeItem(`qris_data_${orderNumber.value}`);
            
            modalStatus.value = 'success';
            modalMessage.value = 'Pembayaran berhasil dikonfirmasi! Pesananmu sedang diproses.';
            showModal.value = true;
        } else {
            modalStatus.value = 'pending';
            modalMessage.value = 'Pembayaran belum terdeteksi. Silakan selesaikan pembayaran terlebih dahulu.';
            showModal.value = true;
        }
    } catch (e) {
        console.error('Check status error:', e);
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

const downloadQrImage = async () => {
    if (!qrImageUrl.value) return;

    try {
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const dataURL = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `QRIS-${orderNumber.value}.png`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        img.onerror = () => {
            console.error('Gagal memuat gambar untuk diunduh.');
            window.open(qrImageUrl.value, '_blank');
        };

        img.src = qrImageUrl.value;

    } catch (e) {
        console.error('Terjadi kesalahan saat mendownload QR:', e);
    }
};

const startPolling = () => {
    if (isPaid.value) {
        if (pollInterval) clearInterval(pollInterval);
        return;
    }
    
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(async () => {
        if (isExpired.value || modalStatus.value === 'success' || isPaid.value) {
            clearInterval(pollInterval);
            return;
        }

        try {
            const response = await axios.post('/payment/qris/check-status', {
                order_number: orderNumber.value
            });

            const paidStatus = response.data.paid || response.data.status === 'completed' || response.data.payment_status === 'paid';
            
            if (paidStatus) {
                isPaid.value = true;
                clearInterval(pollInterval);
                localStorage.removeItem(`qris_data_${orderNumber.value}`);
                
                modalStatus.value = 'success';
                modalMessage.value = 'Pembayaran berhasil dikonfirmasi! Pesananmu sedang diproses.';
                showModal.value = true;
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
    }, 5000);
};

onMounted(() => {
    generateQris().then(() => {
        if (!isPaid.value) {
            startPolling();
        }
    });
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (pollInterval) clearInterval(pollInterval);
});
</script>

<template>
    <div class="w-full bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col justify-between p-4 overflow-hidden transition-colors duration-300 relative">
<main class="main-scroll-container flex-1 overflow-y-auto p-4 space-y-6 pb-32 scroll-smooth">
            <div class="text-center space-y-1">
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Tagihan</p>
                <p class="text-2xl font-extrabold text-[#ff5722]">Rp {{ formatPrice(amount) }}</p>
                <p class="text-xs text-gray-500">Invoice: <span class="font-bold text-gray-800 dark:text-gray-200">{{ orderNumber }}</span></p>
            </div>

            <div v-if="!loading && !errorMessage" class="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <span class="text-gray-500">Sisa Waktu:</span>
                <span class="font-mono font-bold text-[#ff5722]">{{ isExpired ? 'Kedaluwarsa' : formattedCountdown }}</span>
            </div>

            <div class="bg-gray-50 dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center space-y-3 min-h-[22rem]">
                
                <template v-if="isPaid">
                    <div class="w-20 h-20 bg-green-100 dark:bg-green-950/50 text-green-500 rounded-full flex items-center justify-center text-4xl shadow-inner mb-2">
                        ✓
                    </div>
                    <div class="text-center space-y-1">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pembayaran Berhasil</h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                            Tagihan untuk pesanan ini telah lunas dibayar. Terima kasih!
                        </p>
                    </div>
                    <div class="pt-2">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Status: Selesai
                        </span>
                    </div>
                </template>

                <template v-else>
                    <div v-if="loading" class="text-xs text-gray-400 animate-pulse">Memuat QRIS...</div>
                    <div v-else-if="errorMessage" class="text-xs text-red-500 text-center px-4">{{ errorMessage }}</div>
                    
                    <template v-else>
                        <img :src="qrImageUrl" alt="QRIS" class="w-80 h-80 object-contain bg-white p-2 rounded-xl" :class="{ 'opacity-20 blur-xs': isExpired }" />
                        
                        <button 
                            @click="downloadQrImage" 
                            class="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#ff5722] dark:hover:text-[#ff5722] flex items-center gap-1.5 py-1 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download QR Code
                        </button>
                    </template>
                </template>

            </div>

            <div class="text-[11px] text-gray-500 text-center px-4">
                Scan QR di atas menggunakan aplikasi M-Banking atau E-Wallet pilihanmu.
            </div>
        </main>

        <div class="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300 space-y-2.5 pt-4 ">
            <button 
                @click="checkStatus" 
                :disabled="checking || isExpired"
                class="w-full bg-[#ff5722] hover:bg-[#f4511e] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50">
                {{ checking ? 'Mengecek...' : 'Cek Pembayaran' }}
            </button>
            <button 
                @click="router.push({ name: 'orders', params: { order_number: orderNumber } })" 
                class="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition">
                Lihat Pesanan
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