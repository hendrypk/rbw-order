import { defineStore } from 'pinia';
import { VOUCHERS, DELIVERY_OPTIONS, PAYMENT_METHODS } from '@/data/mockData';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [], 
    restaurant: null, 
    appliedVoucher: null, 
    selectedDeliveryOption: DELIVERY_OPTIONS[1], 
    selectedPaymentMethod: PAYMENT_METHODS[0], 
    deliveryNote: '',
    
    // --- TAMBAHAN BARU UNTUK OPSI PESANAN ---
    orderType: 'delivery', // Pilihan: 'delivery' atau 'pickup'
    pickupTime: 'Segera (As Soon As Possible)', // Waktu pilihan jika memilih pickup
  }),

  getters: {
    // Menggunakan totalItems agar sinkron dengan komponen Catalog.vue kamu
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },

    itemCount: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },

    subtotal: (state) => {
      return state.items.reduce((total, item) => {
        const customTotal = (item.customizations || []).reduce((acc, c) => acc + (c.extraPrice || 0), 0);
        return total + (item.price + customTotal) * item.quantity;
      }, 0);
    },

    totalPrice: (state) => {
      return state.subtotal;
    },

    deliveryFee: (state) => {
      // Jika mode pickup, ongkir otomatis 0 (gratis)
      if (state.orderType === 'pickup') return 0;
      if (!state.restaurant) return 0;
      if (state.selectedDeliveryOption) {
        return state.selectedDeliveryOption.price;
      }
      return state.restaurant.deliveryFee || 8000;
    },

    platformFee: (state) => {
      return state.items.length > 0 ? 2000 : 0;
    },

    discountAmount: (state) => {
      if (!state.appliedVoucher || state.subtotal === 0) return 0;

      const v = state.appliedVoucher;
      if (state.subtotal < v.minSpend) return 0;

      if (v.discountType === 'percent') {
        const rawDiscount = (state.subtotal * v.discountValue) / 100;
        return Math.min(rawDiscount, v.maxDiscount || Infinity);
      } else if (v.discountType === 'fixed') {
        return v.discountValue;
      } else if (v.discountType === 'shipping') {
        // Kalau pickup dan voucher diskon ongkir, diabaikan atau disesuaikan
        if (state.orderType === 'pickup') return 0;
        return Math.min(v.discountValue, state.deliveryFee);
      }
      return 0;
    },

    grandTotal: (state) => {
      if (state.items.length === 0) return 0;
      const total = state.subtotal + state.deliveryFee + state.platformFee - state.discountAmount;
      return Math.max(0, total);
    },
  },

  actions: {
    addItem(product) {
        const productId = product.id || product.uuid || product.menu_id;

        if (!productId) {
            console.error('Gagal menambahkan item: Produk tidak memiliki ID yang valid', product);
            return;
        }

        const existingItem = this.items.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.image || product.image_path,
                quantity: product.quantity || 1
            });
        }
    },
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
    },

    clearCart() {
        this.items = [];
    },

    // --- TAMBAHAN ACTION UNTUK MENGUBAH TIPE PESANAN ---
    setOrderType(type) {
        this.orderType = type; // 'delivery' atau 'pickup'
    },

    setPickupTime(time) {
        this.pickupTime = time;
    }
  }
});