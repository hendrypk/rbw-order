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

// Format Rupiah
const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

// Ambil QRIS dari backend saat halaman dimuat
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
        
        // Tampilkan pesan error spesifik dari backend jika ada
        errorMessage.value = err.response?.data?.message || 'Gagal memuat kode QRIS dari server.';
    } finally {
        loading.value = false;
    }
};

// Cek Status Pembayaran
const checkStatus = async () => {
    checking.value = true;
    try {
        const response = await axios.post('/payment/qris/check-status', {
            order_number: orderNumber.value
        });

        const status = response.data.status || response.data.payment_status;
        
        if (status === 'completed' || status === 'paid' || response.data.paid) {
            alert('Pembayaran Berhasil!');
            // Arahkan ke halaman detail pesanan atau sukses
            router.push({
                name: 'order-detail',
                params: { order_number: orderNumber.value }
            });
        } else {
            alert('Pembayaran belum terdeteksi. Silakan selesaikan pembayaran.');
        }
    } catch (e) {
        alert('Gagal mengecek status pembayaran.');
    } finally {
        checking.value = false;
    }
};

onMounted(() => {
    generateQris();
});
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 min-h-screen p-4 flex flex-col justify-between pb-8">
        <div>
            <!-- Header -->
            <div class="flex items-center mb-6">
                <button @click="router.push('/')" class="text-gray-800 p-1 -ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 class="text-base font-bold text-gray-900 ml-3">Pembayaran QRIS</h1>
            </div>

            <!-- Card Utama QRIS -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
                <div>
                    <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Tagihan</p>
                    <p class="text-2xl font-extrabold text-[#ff5722] mt-1">Rp {{ formatPrice(amount) }}</p>
                    <p class="text-xs text-gray-500 mt-1">Invoice: <span class="font-bold text-gray-800">{{ orderNumber }}</span></p>
                </div>

                <!-- Area Barcode QRIS -->
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-center items-center my-4">
                    <div v-if="loading" class="py-16 text-xs text-gray-400 animate-pulse">
                        Memuat QRIS...
                    </div>
                    <div v-else-if="errorMessage" class="py-10 text-xs text-red-500">
                        {{ errorMessage }}
                    </div>
                    <img 
                        v-else 
                        :src="qrisData?.qr_image || qrisData?.qris_url || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + orderNumber" 
                        alt="QRIS Code" 
                        class="w-56 h-56 object-contain mx-auto" 
                    />
                </div>

                <div class="text-left bg-orange-50/60 p-3 rounded-2xl border border-orange-100 text-[11px] text-gray-600 space-y-1">
                    <p class="font-bold text-orange-800">Cara Pembayaran:</p>
                    <p>1. Buka aplikasi M-Banking atau E-Wallet (BCA, GoPay, OVO, DANA, dll).</p>
                    <p>2. Pilih menu <b>Scan QR / QRIS</b>.</p>
                    <p>3. Arahkan kamera ke kode QR di atas lalu konfirmasi pembayaran.</p>
                </div>
            </div>
        </div>

        <!-- Tombol Aksi Bawah -->
        <div class="space-y-2.5 pt-6">
            <button 
                @click="checkStatus" 
                :disabled="checking"
                class="w-full bg-[#ff5722] hover:bg-[#f4511e] text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50">
                {{ checking ? 'Mengecek...' : 'Cek Status Pembayaran' }}
            </button>
            <button 
                @click="router.push('/')" 
                class="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-semibold text-xs transition">
                Kembali ke Menu Utama
            </button>
        </div>
    </div>
</template>