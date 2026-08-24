import axios from '@/axios';

export default {
    async getProducts() {
        // Sesuaikan endpoint '/api/products' dengan rute di backend Laravel kamu
        const response = await axios.get('/menus');
        return response.data;
    }
};