import api from '@/axios';

export default {
    // Mengambil daftar riwayat pesanan user yang sedang login
    async getUserOrders() {
        const response = await api.get('/v1/user/my-orders');
        return response.data;
    },

    // Melakukan checkout / pembuatan pesanan baru
    async checkout(payload) {
        const response = await api.post('/v1/user/checkout', payload);
        return response.data;
    },

    // Cek status pembayaran QRIS berdasarkan nomor order
    async checkQrisStatus(orderNumber) {
        const response = await api.post('/v1/user/payment/qris/check-status', {
            order_number: orderNumber
        });
        return response.data;
    }
};