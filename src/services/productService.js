import axios from '@/axios'

export default {
  // Tambahkan "params" sebagai parameter fungsi
  getProducts(params = {}) {
    // Teruskan params ke fungsi axios
    return axios.get('/menus', { params })
  },
}
