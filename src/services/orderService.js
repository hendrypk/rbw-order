import api from '@/axios';

export default {
    // Mengambil daftar riwayat pesanan user yang sedang login
    async getUserOrders() {
        const response = await api.get('/my-orders');
        return response.data;
    },

    // Melakukan checkout / pembuatan pesanan baru
    async checkout(payload) {
        const response = await api.post('/checkout', payload);
        return response.data;
    },

    // Cek status pembayaran QRIS berdasarkan nomor order
    async checkQrisStatus(orderNumber) {
        const response = await api.post('/payment/qris/check-status', {
            order_number: orderNumber
        });
        return response.data;
    }
};