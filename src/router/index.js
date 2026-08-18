import { createRouter, createWebHistory } from 'vue-router';
import Catalog from '@/views/Catalog.vue';
import Cart from '@/views/Cart.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Profile from '@/views/Profile.vue';
import Dashboard from '@/views/Dashboard.vue';
import Checkout from '@/views/Checkout.vue';
import QrisPayment from '@/views/QrisPayment.vue';

const routes = [
    { path: '/', name: 'catalog', component: Catalog },
    { path: '/dashboard', name: 'dashboard', component: Dashboard },
    { path: '/checkout', name: 'checkout', component: Checkout },
    { path: '/checkout/pay', name: 'qris', component: QrisPayment },
    { path: '/cart', name: 'cart', component: Cart },
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
    { path: '/profile', name: 'profile', component: Profile },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Catatan: Karena menggunakan Cookie Session, penjagaan halaman privat 
// ditangani secara otomatis oleh Axios Response Interceptor (jika 401 -> lempar ke login),
// sehingga router.beforeEach yang mengecek localStorage bisa dihapus/dikosongkan.

export default router;