<!-- src/views/Checkout.vue -->
<script setup>
import { useCartStore } from '@/stores/cart';
import { ref, onMounted, computed } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const router = useRouter();

// State profil user (menyimpan nama & nomor telepon hasil login)
const currentUser = ref({ 
    name: '', 
    phone: '' 
});

const shippingAddress = ref('Nomor Meja / Area Dine-In');
const globalNotes = ref('');

// State waktu pesanan
const scheduleType = ref('now'); 
const scheduledDate = ref('');
const scheduledTime = ref('17:30');

// Generate jam kelipatan 30 menit (17:30 - 23:00)
const timeSlots = computed(() => {
    const slots = [];
    let currentHour = 17;
    let currentMinute = 30;

    while (currentHour < 23 || (currentHour === 23 && currentMinute === 0)) {
        const formattedHour = String(currentHour).padStart(2, '0');
        const formattedMinute = String(currentMinute).padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);

        currentMinute += 30;
        if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour += 1;
        }
    }
    return slots;
});

const minDate = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
});

const loading = ref(false);
const errorMessage = ref('');

// Ambil data profil user yang sedang login saat halaman dimuat
// Ambil data profil user langsung dari localStorage saat halaman dimuat
onMounted(() => {
    try {
        const savedCustomer = localStorage.getItem('customer_data');
        if (savedCustomer) {
            const customerObj = JSON.parse(savedCustomer);
            currentUser.value = {
                name: customerObj.name || 'Pelanggan',
                phone: customerObj.phone || customerObj.whatsapp || '08123456789'
            };
        } else {
            // Fallback jika belum ada data tersimpan
            currentUser.value = {
                name: 'Pelanggan Setia',
                phone: '08123456789'
            };
        }
    } catch (e) {
        console.warn('Gagal membaca data customer dari storage.');
    }
});
const formatPrice = (price) => {
    if (!price) return '0';
    return Number(price).toLocaleString('id-ID');
};

const submitCheckout = async () => {
    if (cartStore.items.length === 0) return;

    if (scheduleType.value === 'later' && (!scheduledDate.value || !scheduledTime.value)) {
        errorMessage.value = 'Silakan pilih tanggal dan jam pengambilan!';
        return;
    }
    
    errorMessage.value = '';
    loading.value = true;
    
    try {
        // Ambil backend URL secara dinamis sesuai environment
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

        // 1. Pastikan CSRF cookie diperbarui sebelum melakukan POST stateful
        await axios.get(`${backendUrl}/sanctum/csrf-cookie`, {
            withCredentials: true
        });

        let scheduleInfo = scheduleType.value === 'now' 
            ? '[Pesan Sekarang]' 
            : `[Terjadwal: Tanggal ${scheduledDate.value} Jam ${scheduledTime.value} WIB]`;
        
        const combinedNotes = `${scheduleInfo} Catatan: ${globalNotes.value}`.trim();

        const payload = {
            customer_name: currentUser.value.name || 'Pelanggan',
            customer_phone: currentUser.value.phone || '08123456789',
            shipping_address: shippingAddress.value || 'Dine In',
            notes: combinedNotes,
            items: cartStore.items.map(item => ({
                menu_id: item.id,
                quantity: item.quantity
            }))
        };

        // 2. Kirim request checkout menggunakan instance axios ber-cookie
        const response = await axios.post('/checkout', payload);
        
        if (response.data && response.data.status === 'success') {
            const orderData = response.data.data;
            
            cartStore.clearCart();

            router.push({
                name: 'qris',
                query: {
                    order_number: orderData.order_number,
                    amount: orderData.final_total || cartStore.totalPrice
                }
            });
        } else {
            throw new Error(response.data.message || 'Gagal memproses pesanan.');
        }

    } catch (error) {
        console.error('Gagal checkout:', error);
        
        // Jika server tetap merespons 401, arahkan paksa ke halaman login
        if (error.response && error.response.status === 401) {
            errorMessage.value = 'Sesi Anda telah habis. Silakan masuk kembali.';
            setTimeout(() => {
                router.push({ name: 'login' });
            }, 1500);
            return;
        }

        errorMessage.value = error.response?.data?.message || error.message || 'Terjadi kesalahan pada sistem.';
    } finally {
        loading.value = false;
    }
};

</script>

<template>
    <div class="max-w-md mx-auto bg-white min-h-screen flex flex-col">
        <!-- Header Minimalis -->
        <header class="sticky top-0 bg-white z-20 px-4 py-3 border-b border-gray-100 flex items-center shadow-xs">
            <button @click="router.back()" class="text-gray-800 p-1 -ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h1 class="text-base font-bold text-gray-900 ml-3">Konfirmasi Pesanan</h1>
        </header>

        <!-- Main Content -->
        <main class="p-4 space-y-4 flex-1">
            <!-- Error Alert -->
            <div v-if="errorMessage" class="p-3 bg-red-50 text-red-600 text-xs rounded-xl text-center font-medium">
                {{ errorMessage }}
            </div>

            <!-- Bagian 1: Waktu Penyiapan (Dropdown Kelipatan 30 Menit) -->
            <div class="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2.5">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700">Waktu Penyiapan</span>
                    <div class="flex bg-gray-200/70 p-0.5 rounded-xl text-xs font-semibold">
                        <button @click="scheduleType = 'now'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'now' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500']">Sekarang</button>
                        <button @click="scheduleType = 'later'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'later' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500']">Terjadwal</button>
                    </div>
                </div>

                <div v-if="scheduleType === 'later'" class="grid grid-cols-2 gap-2 pt-1">
                    <input 
                        v-model="scheduledDate" 
                        type="date" 
                        :min="minDate"
                        class="p-2 border border-gray-200 rounded-xl text-xs bg-white outline-none" 
                    />
                    <!-- Dropdown Jam Kelipatan 30 Menit (17:30 - 23:00) -->
                    <select v-model="scheduledTime" class="p-2 border border-gray-200 rounded-xl text-xs bg-white outline-none font-medium">
                        <option v-for="time in timeSlots" :key="time" :value="time">{{ time }} WIB</option>
                    </select>
                </div>
            </div>

            <!-- Bagian 2: Ringkasan Item Pesanan (Dengan Foto) -->
            <div>
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Menu yang Dipilih</h2>
                <div class="space-y-3">
                    <div v-for="item in cartStore.items" :key="item.id" class="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-3 items-start">
                        
                        <!-- Foto Menu -->
                        <div class="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img 
                                :src="item.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'11\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'" 
                                @error="$event.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'11\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'"
                                :alt="item.name"
                                class="w-full h-full object-cover"
                            />
                        </div>

                        <!-- Detail Info & Kontrol -->
                        <div class="flex-1 min-w-0 space-y-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-gray-900 text-xs truncate">{{ item.name }}</h4>
                                    <p class="text-[11px] text-gray-500">Rp {{ formatPrice(item.price) }}</p>
                                </div>
                                <span class="font-bold text-gray-900 text-xs">Rp {{ formatPrice(item.price * item.quantity) }}</span>
                            </div>

                            <div class="flex items-center justify-between gap-2 pt-1">
                                <!-- Qty Stepper -->
                                <div class="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                                    <button @click="item.quantity > 1 ? item.quantity-- : cartStore.removeItem(item.id)" class="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100">-</button>
                                    <span class="px-2.5 text-xs font-bold text-gray-800">{{ item.quantity }}</span>
                                    <button @click="item.quantity++" class="px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-100">+</button>
                                </div>
                                
                                <!-- Catatan Item -->
                                <input 
                                    v-model="item.itemNote" 
                                    type="text" 
                                    placeholder="Catatan (opsional)" 
                                    class="flex-1 p-1.5 bg-white border border-gray-200 rounded-xl text-[11px] text-gray-800 focus:ring-1 focus:ring-[#ff5722] outline-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- Bagian 3: Lokasi & Catatan Global -->
            <div class="space-y-2.5 pt-2">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Informasi Pengantaran</h2>
                <input 
                    v-model="shippingAddress" 
                    type="text" 
                    placeholder="Nomor Meja atau Alamat" 
                    class="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:bg-white focus:border-gray-300 transition"
                />
                <textarea 
                    v-model="globalNotes" 
                    placeholder="Catatan tambahan untuk pesanan secara keseluruhan..." 
                    class="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs resize-none outline-none focus:bg-white focus:border-gray-300 transition"
                    rows="2"
                ></textarea>
            </div>

            <!-- Bagian 4: Ringkasan Total & Pembayaran -->
            <div class="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 space-y-2">
                <div class="flex justify-between text-xs text-gray-600">
                    <span>Total Item</span>
                    <span class="font-semibold">{{ cartStore.totalItems }} pcs</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-orange-200/60">
                    <span class="font-bold text-gray-900 text-sm">Total Pembayaran</span>
                    <span class="font-extrabold text-base text-[#ff5722]">Rp {{ formatPrice(cartStore.totalPrice) }}</span>
                </div>
                <div class="text-[10px] text-center font-bold text-orange-700 bg-orange-100/60 py-1 rounded-lg mt-1">
                    Metode Pembayaran: QRIS Only
                </div>
            </div>
        </main>

        <!-- Sticky Bottom Button -->
        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-gray-100 z-30 shadow-lg">
            <button 
                @click="submitCheckout"
                :disabled="loading || cartStore.items.length === 0"
                class="bg-[#ff5722] hover:bg-[#f4511e] w-full py-3.5 rounded-2xl font-bold text-white text-xs tracking-wider uppercase shadow-md transition disabled:opacity-50">
                {{ loading ? 'Memproses...' : 'Lanjut ke QRIS (Rp ' + formatPrice(cartStore.totalPrice) + ')' }}
            </button>
        </div>
    </div>
</template>