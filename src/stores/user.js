import { defineStore } from 'pinia';
import { USER_PROFILE, ADDRESSES, VOUCHERS } from '@/data/mockData';

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: { ...USER_PROFILE },
    addresses: [...ADDRESSES],
    selectedAddress: ADDRESSES[0],
    vouchers: [...VOUCHERS],
    favorites: ['rest_1', 'rest_3'], // restaurant IDs
  }),

  getters: {
    gopayBalanceFormatted: (state) => {
      return `Rp ${state.profile.gopayBalance.toLocaleString('id-ID')}`;
    },
  },

  actions: {
    selectAddress(addrId) {
      const found = this.addresses.find((a) => a.id === addrId);
      if (found) {
        this.selectedAddress = found;
      }
    },

    addAddress(newAddr) {
      const id = `addr_${Date.now()}`;
      const addrObj = { id, ...newAddr };
      this.addresses.push(addrObj);
      this.selectedAddress = addrObj;
    },

    topUpGopay(amount) {
      if (amount > 0) {
        this.profile.gopayBalance += amount;
        return true;
      }
      return false;
    },

    deductGopay(amount) {
      if (this.profile.gopayBalance >= amount) {
        this.profile.gopayBalance -= amount;
        return true;
      }
      return false;
    },

    toggleFavorite(restaurantId) {
      const index = this.favorites.indexOf(restaurantId);
      if (index > -1) {
        this.favorites.splice(index, 1);
      } else {
        this.favorites.push(restaurantId);
      }
    },

    isFavorite(restaurantId) {
      return this.favorites.includes(restaurantId);
    },
  },
});
