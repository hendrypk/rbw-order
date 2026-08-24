<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useCartStore } from '@/stores/cart';
import productService from '@/services/productService';
import { useRouter } from 'vue-router';
import axios from '@/axios';
import PwaInstallPrompt from '@/components/PwaInstallPrompt.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const router = useRouter();
const cartStore = useCartStore();

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const activeCategory = ref(null);
const isSearchOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref(null); 

let isScrollingByClick = false;

const toggleSearch = async () => {
    isSearchOpen.value = !isSearchOpen.value;
    
    if (isSearchOpen.value) {
        await nextTick(); 
        searchInput.value?.focus();
    } else {
        searchQuery.value = ''; 
    }
};

const closeSearch = () => {
    searchQuery.value = '';
    isSearchOpen.value = false;
};

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
};

const goToProfile = () => {
    isDropdownOpen.value = false;
    router.push({ name: 'profile' }); 
};

const handleLogout = async () => {
    try {
        await axios.post('/logout')
    } catch (error) {
        if (error.response && error.response.status !== 401) {
            console.error('Gagal logout:', error)
        }
    } finally {
        localStorage.removeItem('customer_data'); 
        router.push({ name: 'login' })
    }
}

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
        await nextTick();
        setupScrollSpy();
    }
};

const groupedProducts = computed(() => {
    if (!products.value || products.value.length === 0) return {};
    
    let filtered = products.value;
    if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(query) || 
            (product.description && product.description.toLowerCase().includes(query))
        );
    }

    return filtered.reduce((acc, product) => {
        const categoryName = product.category?.name || 'Menu Lainnya';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
    }, {});
});

const scrollToCategory = (categoryName) => {
    activeCategory.value = categoryName;
    isScrollingByClick = true;

    const elementId = `category-${categoryName.replace(/\s+/g, '-')}`;
    const el = document.getElementById(elementId);

    if (el) {
        const container = document.querySelector('.main-scroll-container');
        if (container) {
            const headerOffset = 120;
            const elementPosition = el.offsetTop;
            
            container.scrollTo({
                top: elementPosition - headerOffset,
                behavior: 'smooth'
            });
        }

        setTimeout(() => {
            isScrollingByClick = false;
        }, 600);
    }
};

let observer = null;
const setupScrollSpy = () => {
    if (observer) observer.disconnect();

    const options = {
        root: document.querySelector('.main-scroll-container'),
        rootMargin: '-120px 0px -50% 0px',
        threshold: 0
    };

    observer = new IntersectionObserver((entries) => {
        if (isScrollingByClick) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const categoryName = entry.target.getAttribute('data-category');
                if (categoryName) {
                    activeCategory.value = categoryName;
                }
            }
        });
    }, options);

    const sections = document.querySelectorAll('.category-section');
    sections.forEach(section => observer.observe(section));
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') return '0';
  const numericPrice = typeof price === 'string' ? Number(price.replace(/[^0-9.-]+/g,"")) : Number(price);
  if (isNaN(numericPrice)) return '0';
  return numericPrice.toLocaleString('id-ID');
}

const getCartItemQuantity = (product) => {
    const productId = product.id || product.uuid || product.menu_id;
    const item = cartStore.items.find(i => i.id === productId);
    return item ? item.quantity : 0;
};

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
    if (observer) observer.disconnect();
});
</script>

<template>
    <div class="w-full max-w-md mx-auto bg-gray-50 dark:bg-gray-950 h-dvh flex flex-col relative overflow-hidden transition-colors duration-300">
        
        <!-- HEADER STICKY -->
        <header class="sticky top-0 bg-white/80 dark:bg-gray-900/85 backdrop-blur-md z-40 border-b border-gray-100 dark:border-gray-800 transition-all shrink-0">
            <div class="px-4 py-3 flex items-center justify-between">
                <div class="flex flex-col items-start">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-orange-500">Official Store</span>
                    <h1 class="text-xs font-black text-gray-900 dark:text-white tracking-tight">Roti Bakar Wisuda</h1>
                </div>

                <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                    <!-- Tombol Toggle Tema -->
                    <ThemeToggle />

                    <!-- Tombol Search -->
                    <button @click="toggleSearch" class="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    
                    <!-- Dropdown Profil & Logout -->
                    <div class="relative inline-block text-left">
                        <button 
                            @click.stop="toggleDropdown" 
                            class="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center transition border border-orange-100 dark:border-orange-500/20 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div 
                            v-if="isDropdownOpen" 
                            class="absolute right-0 mt-2.5 w-48 bg-white dark:bg-gray-900 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 text-xs font-medium text-gray-700 dark:text-gray-200 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in zoom-in-95 duration-150"
                        >
                            <div class="px-1.5 pb-1">
                                <button 
                                    @click="goToProfile" 
                                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-2 text-gray-800 dark:text-gray-200 transition font-semibold"
                                >
                                    ✨ Profil Saya
                                </button>
                            </div>
                            <div class="px-1.5 pt-1">
                                <button 
                                    @click="handleLogout" 
                                    class="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2 transition font-semibold"
                                >
                                    🚪 Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABS KATEGORI -->
            <div class="flex overflow-x-auto px-4 py-2.5 gap-2 no-scrollbar border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
                <button 
                    v-for="(items, categoryName) in groupedProducts" 
                    :key="categoryName"
                    @click="scrollToCategory(categoryName)"
                    :class="[
                        'px-4 py-2 text-xs font-bold whitespace-nowrap rounded-full transition-all duration-200 shadow-sm active:scale-95',
                        activeCategory === categoryName 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/25 shadow-md' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    ]">
                    {{ categoryName }}
                </button>
            </div>
        </header>

        <!-- SEARCH BAR -->
        <div v-if="isSearchOpen" class="bg-white dark:bg-gray-900 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all z-30 shrink-0">
            <div class="relative flex items-center">
                <input 
                    ref="searchInput"
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Cari menu roti bakar favoritmu..." 
                    class="w-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-100 px-4 py-2.5 pl-10 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition"
                />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 dark:text-gray-500 absolute left-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                <button @click="closeSearch" class="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold p-1">
                    ✕
                </button>
            </div>
        </div>

        <!-- MAIN CONTAINER (SCROLLABLE AREA) -->
        <main class="main-scroll-container flex-1 overflow-y-auto p-4 space-y-6 pb-32 scroll-smooth">
            <div v-if="loading" class="text-center py-12 text-gray-400 dark:text-gray-500 text-xs font-medium">Lagi nyiapin menu terenak buat kamu... 🍞</div>
            <div v-else-if="errorMessage" class="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs text-center font-medium">{{ errorMessage }}</div>
            <div v-else-if="products.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500 text-xs font-medium">Belum ada menu tersedia nih.</div>

            <div 
                v-for="(items, categoryName) in groupedProducts" 
                :key="categoryName" 
                :id="`category-${categoryName.replace(/\s+/g, '-')}`"
                :data-category="categoryName"
                class="space-y-3 category-section pt-2"
            >
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                        {{ categoryName }}
                    </h2>
                    <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-gray-800 px-2 py-0.5 rounded-full">{{ items.length }} Pilihan</span>
                </div>

                <div v-for="product in items" :key="product.id" class="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-800 flex gap-3.5 relative items-center group">
                    
                    <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
                        <img 
                            :src="product.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'12\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'" 
                            @error="$event.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'50\' y=\'50\' font-family=\'sans-serif\' font-size=\'12\' font-weight=\'600\' fill=\'%239ca3af\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ENo Image%3C/text%3E%3C/svg%3E'"
                            :alt="product.name"
                            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                    </div>

                    <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <div>
                            <h3 class="font-bold text-gray-900 dark:text-white text-xs truncate">{{ product.name }}</h3>
                            <p class="text-gray-400 dark:text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed" v-if="product.description">
                                {{ product.description }}
                            </p>
                        </div>

                        <div class="flex items-center justify-between mt-2.5">
                            <span class="font-black text-gray-900 dark:text-white text-xs">Rp {{ formatPrice(product.price) }}</span>

                            <div>
                                <button 
                                    v-if="getCartItemQuantity(product) === 0" @click="handleAdd(product)"
                                    class="bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-orange-600 dark:text-orange-400 border border-orange-200/60 dark:border-orange-500/20 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm active:scale-95">
                                    + Add
                                </button>

                                <div v-else class="bg-orange-500 text-white rounded-xl flex items-center justify-between px-2 py-1 shadow-md shadow-orange-500/20 w-24">
                                    <button @click="handleDecrease(product)" class="font-bold text-sm px-1 text-white/90 hover:text-white transition">-</button>
                                    <span class="text-xs font-black">{{ getCartItemQuantity(product) }}</span>
                                    <button @click="handleAdd(product)" class="font-bold text-sm px-1 text-white/90 hover:text-white transition">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- FLOATING CHECKOUT BAR -->
        <div v-if="cartStore.totalItems > 0" class="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300">
            <router-link to="/checkout" class="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 hover:from-black hover:to-gray-900 w-full rounded-2xl px-4 py-3.5 flex justify-between items-center shadow-xl shadow-black/15 active:scale-[0.98] transition border border-white/10 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-500 text-white p-2.5 rounded-xl shadow-md shadow-orange-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <div class="text-white">
                        <p class="text-[10px] uppercase font-bold tracking-widest text-orange-400">{{ cartStore.totalItems }} Item Terpilih</p>
                        <p class="font-black text-xs leading-tight">Rp {{ formatPrice(cartTotalPrice) }}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 text-white font-black text-xs bg-orange-500 hover:bg-orange-600 px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition">
                    <span>Checkout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
            </router-link>
        </div>
        <PwaInstallPrompt />
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