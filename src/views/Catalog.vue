<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useCartStore } from '@/stores/cart';
import productService from '@/services/productService';
import { useRouter } from 'vue-router';
import axios from '@/axios'; // Pastikan path axios instance Anda sesuai

const router = useRouter();
const cartStore = useCartStore();

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const activeCategory = ref(null);

// State untuk mengontrol buka/tutup Dropdown Menu (Profil & Logout)
const isDropdownOpen = ref(false);

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

// Navigasi ke halaman profile
const goToProfile = () => {
    isDropdownOpen.value = false;
    router.push({ name: 'profile' }); // Sesuaikan nama route profil di router/index.js
};

// Handle Logout
const handleLogout = async () => {
    try {
        await axios.post('/logout')
    } catch (error) {
        if (error.response && error.response.status !== 401) {
            console.error('Gagal logout:', error)
        }
    } finally {
        localStorage.removeItem('customer_data'); // Hapus data sesi lokal
        router.push({ name: 'login' })
    }
}
// Tutup dropdown otomatis jika pengguna mengklik area di luar komponen dropdown
const closeOnClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        isDropdownOpen.value = false;
    }
};

const fetchProducts = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';
        
        const response = await productService.getProducts();
        
        if (response && response.data) {
            products.value = response.data.menus || [];
            categories.value = response.data.categories || [];
            if (categories.value.length > 0) {
                activeCategory.value = categories.value[0].name;
            }
        } else if (Array.isArray(response)) {
            products.value = response;
        } else {
            products.value = response.data || [];
        }
        
    } catch (error) {
        console.error('Gagal memuat produk:', error);
        errorMessage.value = 'Gagal memuat menu dari server. Cek koneksi backend.';
    } finally {
        loading.value = false;
    }
};

const groupedProducts = computed(() => {
    if (!products.value || products.value.length === 0) return {};
    
    return products.value.reduce((acc, product) => {
        const categoryName = product.category?.name || 'Menu Lainnya';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
    }, {});
});

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0';
  const numericPrice = typeof price === 'string' ? Number(price.replace(/[^0-9.-]+/g,"")) : Number(price);
  if (isNaN(numericPrice)) return '0';
  return numericPrice.toLocaleString('id-ID');
}

// Mendapatkan quantity item di keranjang berdasarkan id, uuid, atau menu_id
const getCartItemQuantity = (product) => {
    const productId = product.id || product.uuid || product.menu_id;
    const item = cartStore.items.find(i => i.id === productId);
    return item ? item.quantity : 0;
};

// Tambah item dengan normalisasi ID yang aman
const handleAdd = (product) => {
    const normalizedProduct = {
        ...product,
        id: product.id || product.uuid || product.menu_id
    };

    if (!normalizedProduct.id) {
        console.error('Produk tidak memiliki ID yang valid:', product);
        return;
    }

    cartStore.addItem(normalizedProduct);
};

// Kurangi item dengan ID yang dinormalisasi
const handleDecrease = (product) => {
    const productId = product.id || product.uuid || product.menu_id;
    const item = cartStore.items.find(i => i.id === productId);
    
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cartStore.removeItem(productId);
        }
    }
};

const cartTotalPrice = computed(() => {
    return cartStore.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

onMounted(() => {
    fetchProducts();
    document.addEventListener('click', closeOnClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', closeOnClickOutside);
});
</script>

<template>
    <div class="max-w-md mx-auto bg-gray-50 min-h-screen relative pb-32">
        
        <!-- HEADER ALA ESB / GOFOOD -->
        <header class="sticky top-0 bg-white z-40 border-b border-gray-100 shadow-sm">
            <!-- Top Bar -->
            <div class="px-4 py-3 flex items-center justify-between">
                <button @click="router.back()" class="text-gray-800 p-1 -ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 class="text-sm font-bold text-gray-900 truncate px-2">Roti Bakar Wisuda</h1>
                <div class="flex items-center gap-3 text-gray-700">
                    <button>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <div class="relative inline-block text-left">
                        <button 
                            @click.stop="toggleDropdown" 
                            class="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <!-- Kotak Dropdown -->
                        <div 
                            v-if="isDropdownOpen" 
                            class="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-50 text-xs font-medium text-gray-700 divide-y divide-gray-50"
                        >
                            <div class="px-1">
                                <button 
                                    @click="goToProfile" 
                                    class="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-2.5 text-gray-800 transition"
                                >
                                    Profil Saya
                                </button>
                            </div>
                            <div class="px-1 pt-1">
                                <button 
                                    @click="handleLogout" 
                                    class="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition"
                                >
                                    Keluar (Logout)
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>
            </div>

            <!-- Horizontal Category Navigation Tabs -->
            <div class="flex overflow-x-auto px-4 gap-6 no-scrollbar border-t border-gray-100">
                <button 
                    v-for="(items, categoryName) in groupedProducts" 
                    :key="categoryName"
                    @click="activeCategory = categoryName"
                    :class="[
                        'py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors',
                        activeCategory === categoryName ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                    ]">
                    {{ categoryName }}
                </button>
            </div>
        </header>

        <!-- MAIN CONTENT KATEGORI & MENU -->
        <main class="p-4 space-y-6">
            <div v-if="loading" class="text-center py-12 text-gray-400 text-xs">Memuat menu...</div>
            <div v-else-if="errorMessage" class="bg-red-50 text-red-600 p-4 rounded-xl text-xs text-center">{{ errorMessage }}</div>
            <div v-else-if="products.length === 0" class="text-center py-12 text-gray-400 text-xs">Belum ada menu tersedia.</div>

            <!-- Render Grouped Menu -->
            <div v-for="(items, categoryName) in groupedProducts" :key="categoryName" class="space-y-3">
                <h2 class="text-sm font-extrabold text-gray-900 tracking-wide">{{ categoryName }}</h2>

                <!-- Card List Item -->
                <div v-for="product in items" :key="product.id" class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-3 relative items-center">
                    
                    <!-- Gambar Produk -->
                    <div class="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                            :src="product.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'12\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'" 
                            @error="$event.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'12\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'"
                            :alt="product.name"
                            class="w-full h-full object-cover"
                        />
                    </div>

                    <!-- Informasi Detail -->
                    <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                            <h3 class="font-bold text-gray-900 text-xs truncate">{{ product.name }}</h3>
                            <p class="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed" v-if="product.description">
                                {{ product.description }}
                            </p>
                        </div>

                        <div class="flex items-center justify-between mt-2">
                            <span class="font-bold text-gray-900 text-xs">Rp {{ formatPrice(product.price) }}</span>

                            <!-- Tombol Add / Quantity Counter (Dioptimalkan agar mudah disentuh) -->
                            <div>
                                
                                <button 
                                    v-if="getCartItemQuantity(product) === 0" @click="handleAdd(product)"
                                    class="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm">
                                    Add
                                </button>

                                <div v-else class="bg-orange-50 border border-orange-200 text-orange-600 rounded-xl flex items-center justify-between px-2 py-1 shadow-sm w-24">
                                    <button @click="handleDecrease(product)" class="font-bold text-sm px-1 text-orange-700">-</button>
                                    <span class="text-xs font-bold text-gray-800">{{ getCartItemQuantity(product) }}</span>
                                    <button @click="handleAdd(product)" class="font-bold text-sm px-1 text-orange-700">+</button>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- FLOATING CHECKOUT BAR (Gaya ESB Order / Gambar Referensi) -->
        <div v-if="cartStore.totalItems > 0" class="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-40 bg-gradient-to-t from-white via-white/90 to-transparent">
            <router-link to="/checkout" class="bg-[#ff5722] hover:bg-[#f4511e] w-full rounded-2xl px-5 py-3.5 flex justify-between items-center shadow-lg shadow-orange-500/30 active:scale-[0.98] transition">
                <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-xl text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div class="text-white">
                        <p class="text-[10px] uppercase font-bold tracking-wider opacity-90">Total ({{ cartStore.totalItems }} Item)</p>
                        <p class="font-extrabold text-sm leading-tight">Rp {{ formatPrice(cartTotalPrice) }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-white font-bold text-xs bg-black/10 px-4 py-2 rounded-xl">
                    <span>CHECK OUT</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
            </router-link>
        </div>

    </div>
</template>

<style scoped>
/* Sembunyikan scrollbar untuk navigasi kategori horizontal */
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>