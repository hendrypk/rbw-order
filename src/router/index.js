import { createRouter, createWebHistory } from 'vue-router';
import Catalog from '@/views/Catalog.vue';
import Cart from '@/views/Cart.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Profile from '@/views/Profile.vue';
import Dashboard from '@/views/Dashboard.vue';
import Checkout from '@/views/Checkout.vue';
import QrisPayment from '@/views/QrisPayment.vue';
import api from '@/axios';
import Orders from '@/views/Orders.vue';
import OrderDetail from '@/views/OrderDetail.vue';

const routes = [
    { path: '/', name: 'catalog', component: Catalog, meta: { requiresAuth: true } },
    { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/checkout', name: 'checkout', component: Checkout, meta: { requiresAuth: true } },
    { path: '/orders', name: 'orders', component: Orders, meta: { requiresAuth: true } },
    { path: '/order/:order_number', name: 'order-detail', component: OrderDetail, meta: { requiresAuth: true } },
    { path: '/checkout/pay', name: 'qris', component: QrisPayment, meta: { requiresAuth: true } },
    { path: '/cart', name: 'cart', component: Cart, meta: { requiresAuth: true } },
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: Login, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: Register, meta: { guestOnly: true } },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Helper cek auth ke backend
const checkAuthWithBackend = async () => {
    try {
        await api.get('/check');
        return true; 
    } catch (error) {
        return false; 
    }
};

router.beforeEach(async (to) => {
    const requiresAuth = to.meta.requiresAuth;

    if (requiresAuth) {
        const isAuthenticated = await checkAuthWithBackend();
        if (!isAuthenticated) {
            return { name: 'login' }; // Redirect bersih tanpa next()
        }
    }
});

export default router;