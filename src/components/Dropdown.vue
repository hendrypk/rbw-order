<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  options: {
    type: Array,
    required: true,
    // Format: [{ label: 'Option 1', value: 'opt1', icon: '...' }]
  },
  placeholder: {
    type: String,
    default: 'Pilih opsi...',
  },
})

const emit = defineEmits(['update:modelValue', 'select'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  emit('select', option)
  isOpen.value = false
}

// Menutup dropdown jika klik di luar area komponen
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Mendapatkan label yang sedang terpilih
const selectedLabel = () => {
  const selected = props.options.find((opt) => opt.value === props.modelValue)
  return selected ? selected.label : props.placeholder
}
</script>

<template>
  <div class="relative inline-block text-left w-full" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      @click="toggleDropdown"
      type="button"
      class="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-900 dark:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800 text-sm font-medium shadow-sm"
    >
      <span class="truncate">{{ selectedLabel() }}</span>
      <svg
        class="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>

    <!-- Dropdown Menu dengan Animasi -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        class="absolute w-full mt-2 p-1.5 origin-top bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
      >
        <div class="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
          <button
            v-for="(option, index) in options"
            :key="index"
            @click="selectOption(option)"
            class="flex items-center w-full px-3 py-2.5 text-sm rounded-lg transition-colors duration-150 text-left"
            :class="[
              modelValue === option.value
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
            ]"
          >
            <!-- Icon Opsional -->
            <span v-if="option.icon" class="mr-2 text-lg">
              {{ option.icon }}
            </span>

            <span class="flex-1 truncate">{{ option.label }}</span>

            <!-- Ceklis jika terpilih (Gaya iOS Native) -->
            <svg
              v-if="modelValue === option.value"
              class="w-4 h-4 ml-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Menyembunyikan scrollbar tapi tetap bisa di-scroll (Safari/Chrome/Firefox) */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
