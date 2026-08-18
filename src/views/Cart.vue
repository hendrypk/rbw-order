<script setup>
import { useCartStore } from '@/stores/cart';
import { ref } from 'vue';
import axios from '@/axios';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const router = useRouter();
const customerName = ref('');
const notes = ref('');
const loading = ref(false);

const checkout = async () => {
    if (cartStore.items.length === 0) return;
    
    loading.value = true;
    try {
        const payload = {
            customer_name: customerName.value,
            notes: notes.value,
            items: cartStore.items.map(item => ({
                id: item.id,
                quantity: item.quantity
            }))
        };

        const response = await axios.post('/api/orders', payload);
        
        // Bersihkan keranjang dan arahkan ke halaman sukses/riwayat
        cartStore.clearCart();
        alert('Pesanan berhasil dibuat!');
        router.push('/');
    } catch (error) {
        console.error('Gagal checkout:', error);
        alert('Terjadi kesalahan saat memproses pesanan.');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="p-4 max-w-md mx-auto pb-24">
        <h1 class="text-2xl font-bold mb-4 text-gray-800">Keranjang Belanja 🛒</h1>

        <div v-if="cartStore.items.length === 0" class="text-center py-12 text-gray-400">
            Keranjangmu masih kosong nih. Yuk pilih menu dulu!
        </div>

        <div v-else>
            <div class="space-y-3 mb-6">
                <div v-for="item in cartStore.items" :key="item.id" class="bg-white p-3 rounded-lg shadow-sm border flex justify-between items-center">
                    <div>
                        <h4 class="font-medium text-gray-800">{{ item.name }}</h4>
                        <p class="text-xs text-gray-500">Rp {{ item.price.toLocaleString('id-ID') }} x {{ item.quantity }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click="cartStore.removeItem(item.id)" class="w-8 h-8 bg-gray-100 rounded-md font-bold text-gray-600">-</button>
                        <span class="text-sm font-semibold w-4 text-center">{{ item.quantity }}</span>
                        <button @click="cartStore.addItem(item)" class="w-8 h-8 bg-orange-100 text-orange-600 rounded-md font-bold">+</button>
                    </div>
                </div>
            </div>

            <!-- Form Pemesan -->
            <div class="bg-white p-4 rounded-xl shadow-sm border mb-6 space-y-3">
                <h3 class="font-semibold text-gray-700">Informasi Pemesan</h3>
                <input 
                    v-model="customerName" 
                    type="text" 
                    placeholder="Nama Pemesan" 
                    class="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <textarea 
                    v-model="notes" 
                    placeholder="Catatan tambahan (opsional)" 
                    class="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                ></textarea>
            </div>

            <!-- Ringkasan & Tombol Checkout -->
            <div class="bg-white p-4 rounded-xl shadow-sm border mb-4">
                <div class="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Total Item</span>
                    <span>{{ cartStore.totalItems }} pcs</span>
                </div>
                <div class="flex justify-between mb-4 font-bold text-lg text-gray-800">
                    <span>Total Harga</span>
                    <span class="text-orange-600">Rp {{ cartStore.totalPrice.toLocaleString('id-ID') }}</span>
                </div>
                <button 
                    @click="router.push('/checkout')"
                    class="w-full bg-[#00880d] text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition shadow-md">
                    Lanjut ke Checkout
                </button>
            </div>
        </div>
    </div>
</template>