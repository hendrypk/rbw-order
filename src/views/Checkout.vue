<script setup>
import { useCartStore } from '@/stores/cart';
import { ref, onMounted, computed } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';
import ThemeToggle from '@/components/ThemeToggle.vue';

const cartStore = useCartStore();
const router = useRouter();

const currentUser = ref({ 
    name: '', 
    phone: '' 
});

const shippingAddress = ref('Nomor Meja / Area Dine-In');
const globalNotes = ref('');

const scheduleType = ref('now'); 
const scheduledDate = ref('');
const scheduledTime = ref('17:30');

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
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
    <div class="max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">

        <main class="main-scroll-container flex-1 overflow-y-auto p-4 space-y-4 pb-32 scroll-smooth">
            <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-xl text-center font-medium">
                {{ errorMessage }}
            </div>

            <div class="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 shadow-sm transition-colors">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700 dark:text-gray-300">Waktu Penyiapan</span>
                    <div class="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-xs font-semibold">
                        <button @click="scheduleType = 'now'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'now' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400']">Sekarang</button>
                        <button @click="scheduleType = 'later'" :class="['px-3 py-1 rounded-lg transition', scheduleType === 'later' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-bold' : 'text-gray-500 dark:text-gray-400']">Terjadwal</button>
                    </div>
                </div>

                <div v-if="scheduleType === 'later'" class="grid grid-cols-2 gap-2 pt-1">
                    <input 
                        v-model="scheduledDate" 
                        type="date" 
                        :min="minDate"
                        class="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none" 
                    />
                    <select v-model="scheduledTime" class="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none font-medium">
                        <option v-for="time in timeSlots" :key="time" :value="time">{{ time }} WIB</option>
                    </select>
                </div>
            </div>

            <div>
                <h2 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Menu yang Dipilih</h2>
                <div class="space-y-3">
                    <div v-for="item in cartStore.items" :key="item.id" class="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-3 items-start shadow-sm transition-colors">
                        
                        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img 
                                :src="item.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'11\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'" 
                                @error="$event.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'11\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'"
                                :alt="item.name"
                                class="w-full h-full object-cover"
                            />
                        </div>

                        <div class="flex-1 min-w-0 space-y-2">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-gray-900 dark:text-white text-xs truncate">{{ item.name }}</h4>
                                    <p class="text-[11px] text-gray-500 dark:text-gray-400">Rp {{ formatPrice(item.price) }}</p>
                                </div>
                                <span class="font-bold text-gray-900 dark:text-white text-xs">Rp {{ formatPrice(item.price * item.quantity) }}</span>
                            </div>

                            <div class="flex items-center justify-between gap-2 pt-1">
                                <div class="flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xs">
                                    <button @click="item.quantity > 1 ? item.quantity-- : cartStore.removeItem(item.id)" class="px-2 py-0.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">-</button>
                                    <span class="px-2.5 text-xs font-bold text-gray-800 dark:text-gray-100">{{ item.quantity }}</span>
                                    <button @click="item.quantity++" class="px-2 py-0.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">+</button>
                                </div>
                                
                                <input 
                                    v-model="item.itemNote" 
                                    type="text" 
                                    placeholder="Catatan (opsional)" 
                                    class="flex-1 p-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-[#ff5722] outline-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="space-y-2.5 pt-2">
                <h2 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Informasi Pengantaran</h2>
                <input 
                    v-model="shippingAddress" 
                    type="text" 
                    placeholder="Nomor Meja atau Alamat" 
                    class="w-full p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-gray-300 dark:focus:border-gray-600 transition"
                />
                <textarea 
                    v-model="globalNotes" 
                    placeholder="Catatan tambahan untuk pesanan secara keseluruhan..." 
                    class="w-full p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs text-gray-800 dark:text-gray-100 resize-none outline-none focus:border-gray-300 dark:focus:border-gray-600 transition"
                    rows="2"
                ></textarea>
            </div>

            <div class="bg-orange-50/50 dark:bg-orange-500/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20 space-y-2 transition-colors">
                <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Total Item</span>
                    <span class="font-semibold">{{ cartStore.totalItems }} pcs</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-orange-200/60 dark:border-orange-500/20">
                    <span class="font-bold text-gray-900 dark:text-white text-sm">Total Pembayaran</span>
                    <span class="font-extrabold text-base text-[#ff5722]">Rp {{ formatPrice(cartStore.totalPrice) }}</span>
                </div>
                <div class="text-[10px] text-center font-bold text-orange-700 dark:text-orange-400 bg-orange-100/60 dark:bg-orange-500/20 py-1 rounded-lg mt-1">
                    Metode Pembayaran: QRIS Only
                </div>
            </div>
        </main>

        <div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-30 shadow-lg transition-colors">
            <button 
                @click="submitCheckout"
                :disabled="loading || cartStore.items.length === 0"
                class="bg-[#ff5722] hover:bg-[#f4511e] w-full py-3.5 rounded-2xl font-bold text-white text-xs tracking-wider uppercase shadow-md transition disabled:opacity-50">
                {{ loading ? 'Memproses...' : 'Lanjut ke QRIS (Rp ' + formatPrice(cartStore.totalPrice) + ')' }}
            </button>
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