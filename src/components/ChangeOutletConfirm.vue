<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
  >
    <div
      class="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in zoom-in-95 duration-200"
    >
      <div
        class="w-14 h-14 mx-auto rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-2xl text-orange-600 dark:text-orange-400"
      >
        ⚠️
      </div>
      <div>
        <h3 class="text-sm font-extrabold text-gray-900 dark:text-white">Ganti Outlet?</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Mengganti outlet akan
          <span class="font-bold text-gray-800 dark:text-gray-200"
            >mengosongkan keranjang belanja</span
          >
          Anda saat ini. Lanjutkan?
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2 pt-1">
        <button
          @click="$emit('cancel')"
          class="py-2.5 rounded-xl font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 transition cursor-pointer"
        >
          Batal
        </button>
        <button
          @click="$emit('confirm')"
          class="py-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md transition cursor-pointer"
        >
          Ya, Ganti
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
}>()

defineEmits(['cancel', 'confirm'])
</script>
