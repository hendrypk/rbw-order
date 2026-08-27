<script setup>
import { useCartStore } from '@/stores/cart';
import { ref, onMounted, computed } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const router = useRouter();

const currentUser = ref({ name: 'Pelanggan', phone: '08123456789' });
const shippingAddress = ref('Nomor Meja / Area Dine-In');
const globalNotes = ref('');

const scheduleType = ref('now'); 
const scheduledDate = ref('');
const scheduledTime = ref('17:30');

// --- STATE VOUCHER (MODAL) ---
const isVoucherModalOpen = ref(false);
const availableVouchers = ref([]);
const appliedVoucher = ref(null);
const isLoadingVouchers = ref(false);

// --- STATE TUKAR POIN (RADIO BUTTON) ---
// --- STATE TUKAR POIN ---
const customerPointsData = ref({ total_points: 0 });
const isPointsUsed = ref(false); // ⬅️ Tambahkan ini

// ⬅️ Tambahkan computed ini
const hasEnoughPoints = computed(() => (customerPointsData.value.total_points || 0) >= 1000);
const usePointsOption = ref('none'); // 'none' atau 'all' (atau bisa disesuaikan nominalnya)
// --- STATE MODAL KONFIRMASI HAPUS ITEM ---
const showDeleteConfirmModal = ref(false);
const itemPendingDelete = ref(null);
const timeSlots = computed(() => {
    const slots = [];
    let currentHour = 17;
    let currentMinute = 30;
    while (currentHour < 23 || (currentHour === 23 && currentMinute === 0)) {
        slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
        currentMinute += 30;
        if (currentMinute >= 60) { currentMinute = 0; currentHour += 1; }
    }
    return slots;
});

const minDate = computed(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
});

const loading = ref(false);
const errorMessage = ref('');

onMounted(async () => {
    try {
        const savedCustomer = localStorage.getItem('customer_data');
        if (savedCustomer) {
            const customerObj = JSON.parse(savedCustomer);
            currentUser.value = {
                name: customerObj.name || 'Pelanggan',
                phone: customerObj.phone || customerObj.whatsapp || '08123456789'
            };
        }
        
        // Ambil profil poin & daftar voucher yang tersedia untuk redeem
        const loyaltyRes = await axios.get('/loyalty-profile');
        if (loyaltyRes.data && loyaltyRes.data.data) {
            customerPointsData.value = loyaltyRes.data.data;
        }

        const voucherRes = await axios.get('/voucher/index'); // Atau endpoint list voucher aktif Anda
        if (voucherRes.data && voucherRes.data.data) {
            availableVouchers.value = voucherRes.data.data;
        }
    } catch (e) {
        console.warn('Gagal memuat data awal.', e);
    }
});

const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};


const confirmDecreaseQty = (item) => {
    if (item.quantity > 1) {
        item.quantity--;
    } else {
        // Jika tinggal 1 dan dikurangi, tampilkan modal konfirmasi hapus
        itemPendingDelete.value = item;
        showDeleteConfirmModal.value = true;
    }
};

const executeDeleteItem = () => {
    if (itemPendingDelete.value) {
        cartStore.removeItem(itemPendingDelete.value.id);
        itemPendingDelete.value = null;
    }
    showDeleteConfirmModal.value = false;
};

const cancelDeleteItem = () => {
    itemPendingDelete.value = null;
    showDeleteConfirmModal.value = false;
};


// --- PILIH VOUCHER DARI MODAL ---
const selectVoucher = (voucher) => {
    appliedVoucher.value = {
        voucher_id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discount_amount: voucher.value // Sesuaikan struktur response backend anda
    };
    isVoucherModalOpen.value = false;
};

const removeVoucher = () => {
    appliedVoucher.value = null;
};

// --- HITUNG POIN YANG DIGUNAKAN ---
const appliedPoints = computed(() => {
    const totalPoinUser = customerPointsData.value.total_points || 0;
    if (isPointsUsed.value && totalPoinUser >= 1000) {
        return totalPoinUser;
    }
    return 0;
});
// --- KALKULASI HARGA ---
const voucherDiscount = computed(() => appliedVoucher.value ? Number(appliedVoucher.value.discount_amount) : 0);
const totalDiscount = computed(() => voucherDiscount.value);

const finalPrice = computed(() => {
    const total = cartStore.totalPrice - totalDiscount.value - appliedPoints.value;
    return total < 0 ? 0 : total;
});

const earnedPoints = computed(() => Math.floor(finalPrice.value / 1000) * 10);

const submitCheckout = async () => {
    if (cartStore.items.length === 0) return;
    if (finalPrice.value <= 0) {
        errorMessage.value = 'Total pembayaran tidak boleh Rp 0!';
        return;
    }
    if (scheduleType.value === 'later' && (!scheduledDate.value || !scheduledTime.value)) {
        errorMessage.value = 'Silakan pilih tanggal dan jam pengambilan!';
        return;
    }
    
    errorMessage.value = '';
    loading.value = true;
    
    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        await axios.get(`${backendUrl}/sanctum/csrf-cookie`, { withCredentials: true });

        let scheduleInfo = scheduleType.value === 'now' ? '[Pesan Sekarang]' : `[Terjadwal: ${scheduledDate.value} ${scheduledTime.value}]`;
        const payload = {
            customer_name: currentUser.value.name,
            customer_phone: currentUser.value.phone,
            shipping_address: shippingAddress.value,
            notes: `${scheduleInfo} ${globalNotes.value}`.trim(),
            voucher_id: appliedVoucher.value ? appliedVoucher.value.voucher_id : null, 
            points_to_use: appliedPoints.value, 
            discount: totalDiscount.value, 
            items: cartStore.items.map(i => ({ menu_id: i.id, quantity: i.quantity }))
        };

        const response = await axios.post('/checkout', payload);
        if (response.data && response.data.status === 'success') {
            cartStore.clearCart();
            router.push({ 
                name: 'qris', 
                query: { 
                    order_number: response.data.data.order_number, 
                    amount: response.data.data.final_total } });
        } else {
            throw new Error(response.data.message || 'Gagal memproses pesanan.');
        }
    } catch (error) {
        errorMessage.value = error.response?.data?.message || error.message || 'Terjadi kesalahan.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        
        <!-- KONTROL UTAMA -->
        <main v-if="cartStore.items.length === 0" class="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center">
            <h3 class="text-xs font-bold text-gray-700 capitalize">Keranjang kosong!</h3>
            <button @click="router.push({ name: 'catalog' })" class="mt-4 bg-orange-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md">Pilih Menu</button>
        </main>
        
        <main v-else class="flex-1 overflow-y-auto p-4 space-y-4 pb-36 scroll-smooth"> <!-- pb-36 agar tidak tertutup floating button -->
            
            <div v-if="errorMessage" class="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-medium">
                {{ errorMessage }}
            </div>

            <!-- Waktu Penyiapan -->
            <div class="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 shadow-sm">
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-gray-700 dark:text-gray-300">Waktu Penyiapan</span>
                    <div class="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl font-semibold">
                        <button @click="scheduleType = 'now'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'now' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500']">Sekarang</button>
                        <button @click="scheduleType = 'later'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'later' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500']">Terjadwal</button>
                    </div>
                </div>
            </div>

            <!-- 1. SHOPEE STYLE: PILIH VOUCHER (BUKA MODAL) -->
            <div @click="isVoucherModalOpen = true" class="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between cursor-pointer shadow-sm hover:border-orange-400 transition">
                <div class="flex items-center gap-2">
                    <div>
                        <h4 class="text-xs font-bold text-gray-700 dark:text-white capitalize">Voucher Toko</h4>
                        <p class="text-[11px] text-gray-400">{{ appliedVoucher ? appliedVoucher.name : 'Pilih atau masukkan voucher' }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <span v-if="appliedVoucher" class="text-xs font-bold text-amber-600">-Rp {{ formatPrice(appliedVoucher.discount_amount) }}</span>
                    <span class="text-gray-400">›</span>
                </div>
            </div>

            <!-- 2. SHOPEE STYLE: TUKAR POIN (RADIO BUTTON SIMPLE) -->
<!-- TUKAR POIN STYLE SHOPEE (TOGGLE SWITCH DI KANAN) -->
            <div class="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-2.5">

                    <div>
                        <p class="text-xs mb-1 font-bold text-gray-900 dark:text-white">
                            <span>Tukarkan {{ Number(customerPointsData.total_points || 0).toLocaleString('id-ID') }} Poin Wisuda</span>
                        </p>
                        <p class="text-[10px] text-gray-400">
                            <span v-if="hasEnoughPoints">Gunakan semua poin untuk potongan harga</span>
                            <span v-else class="text-amber-600 dark:text-amber-400 font-small">Minimal penukaran adalah 1.000 poin</span>
                        </p>
                    </div>
                </div>

                <!-- Toggle Switch Modern di Kanan -->
                <label class="relative inline-flex items-center cursor-pointer" :class="{ 'opacity-40 cursor-not-allowed': !hasEnoughPoints }">
                    <input 
                        type="checkbox" 
                        v-model="isPointsUsed" 
                        :disabled="!hasEnoughPoints"
                        class="sr-only peer"
                    >
                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                </label>
            </div>

            <!-- List Menu Dipilih -->
            <div class="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 shadow-sm">
                <h3 class="text-xs font-bold text-gray-700 dark:text-white capitalize pb-1">Ringkasan Pesanan</h3>
                <div v-for="item in cartStore.items" :key="item.id" class="flex justify-between items-center text-xs py-1 border-b border-gray-50 dark:border-gray-800 last:border-none">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-900 dark:text-white text-xs truncate">{{ item.name }}</h4>
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Rp {{ formatPrice(item.price) }}</p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between gap-2 pt-1">
                        <!-- <input 
                            v-model="item.itemNote" 
                            type="text" 
                            placeholder="Catatan (opsional)" 
                            class="flex-1 p-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-[#ff5722] outline-none"
                        /> -->

                        <div class="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xs flex-shrink-0">
                            <button @click="confirmDecreaseQty(item)" class="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">-</button>
                            <span class="px-2.5 text-xs font-bold text-gray-800 dark:text-gray-100">{{ item.quantity }}</span>
                            <button @click="item.quantity++" class="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">+</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. RINCIAN PEMBAYARAN (TOTAL DISKON & TOTAL KOIN DI BAWAHNYA) -->
            <div class="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs shadow-sm">
                <h3 class="text-xs font-bold text-gray-700 dark:text-white capitalize pb-1">Rincian Pembayaran</h3>
                
                <div class="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Subtotal Pesanan</span>
                    <span class="font-mono">Rp {{ formatPrice(cartStore.totalPrice) }}</span>
                </div>

                <!-- Total Diskon (Gabungan Voucher & Poin) -->
                <div v-if="totalDiscount > 0" class="flex justify-between text-orange-400 font-medium">
                    <span>Total Diskon</span>
                    <span class="font-mono">- Rp {{ formatPrice(totalDiscount) }}</span>
                </div>

                <!-- Total Koin/Poin Digunakan -->
                <div v-if="appliedPoints > 0" class="flex justify-between text-orange-400 font-medium">
                    <span>Total Poin Digunakan</span>
                    <span class="font-mono">{{ appliedPoints.toLocaleString('id-ID') }} Poin</span>
                </div>

                <div class="flex justify-between items-center pt-2.5 border-t border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-900 dark:text-white">
                    <span>Total Pembayaran</span>
                    <span class="font-mono text-gray-700 dark:text-gray-300 text-base">Rp {{ formatPrice(finalPrice) }}</span>
                </div>

                <div class="pt-1 text-[11px] text-amber-600 font-bold flex justify-between">
                    <span>🎁 Poin yang akan didapat</span>
                    <span class="font-mono">+{{ earnedPoints.toLocaleString('id-ID') }} Poin</span>
                </div>
            </div>
        </main>

        <!-- FLOATING BUTTON BAWAH (AMAN TIDAK MENUTUPI KONTEN) -->
        <div v-if="cartStore.items.length > 0" class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 max-w-md mx-auto z-40 flex items-center justify-between shadow-2xl">
            <div>
                <span class="text-[10px] text-gray-400 uppercase block font-bold">Total Pembayaran</span>
                <span class="text-base font-black font-mono text-amber-600">Rp {{ formatPrice(finalPrice) }}</span>
            </div>
            <button @click="submitCheckout" :disabled="loading" class="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50">
                {{ loading ? 'Memproses...' : 'Buat Pesanan' }}
            </button>
        </div>

        <!-- MODAL PILIH VOUCHER (SHOPEE STYLE) -->
        <div v-if="isVoucherModalOpen" class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 class="font-bold text-sm text-gray-900 dark:text-white">Pilih Voucher Toko</h3>
                    <button @click="isVoucherModalOpen = false" class="text-gray-400 hover:text-gray-600 text-sm font-bold">✕</button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
                    <div v-if="appliedVoucher" class="p-3 bg-red-50 rounded-xl flex justify-between items-center text-xs">
                        <span class="font-bold text-red-600">Lepas Voucher Terpakai</span>
                        <button @click="removeVoucher(); isVoucherModalOpen = false;" class="px-3 py-1 bg-red-500 text-white rounded-lg font-bold">Batal Pakai</button>
                    </div>

                    <div v-for="v in availableVouchers" :key="v.id" @click="selectVoucher(v)" class="p-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl flex justify-between items-center cursor-pointer hover:border-orange-500 transition">
                        <div>
                            <h4 class="text-xs font-bold text-gray-700 dark:text-white capitalize pb-1">{{ v.name }}</h4>
                            <p class="text-[11px] text-amber-600 font-medium">Potongan Rp {{ formatPrice(v.value) }}</p>
                        </div>
                        <span class="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">Gunakan</span>
                    </div>

                    <div v-if="availableVouchers.length === 0" class="text-center py-8 text-xs text-gray-400">
                        Tidak ada voucher tersedia saat ini.
                    </div>
                </div>
            </div>
        </div>

    </div>
    <!-- MODAL KONFIRMASI HAPUS MENU -->
        <div v-if="showDeleteConfirmModal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-200">
                
                <div class="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-2xl text-red-600 dark:text-red-400">
                    🗑️
                </div>

                <div>
                    <h3 class="text-sm font-extrabold text-gray-900 dark:text-white">
                        Hapus Menu dari Keranjang?
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Menu <span class="font-bold text-gray-800 dark:text-gray-200">"{{ itemPendingDelete?.name }}"</span> akan dihapus karena jumlahnya mencapai 0.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-1">
                    <button 
                        @click="cancelDeleteItem"
                        class="py-2.5 rounded-xl font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 transition cursor-pointer">
                        Batal
                    </button>
                    <button 
                        @click="executeDeleteItem"
                        class="py-2.5 rounded-xl font-bold text-xs  bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md shadow-white-gray/20 transition cursor-pointer">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>