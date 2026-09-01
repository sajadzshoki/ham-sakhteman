<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  retry?: () => void
}>(), { title: 'خطا', message: 'مشکلی در بارگذاری وجود دارد.', retry: undefined })
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-center gap-3">
    <div class="w-14 h-14 rounded-3xl bg-rose-50 text-rose-400 flex items-center justify-center mb-1 border border-rose-100">
      <Icon name="i-lucide-alert-triangle" class="w-7 h-7" />
    </div>
    <h4 class="text-base font-extrabold text-slate-800">{{ title }}</h4>
    <p class="text-sm text-slate-400 font-medium max-w-xs">{{ message }}</p>
    <button v-if="retry" @click="retry" class="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">تلاش مجدد</button>
  </div>
</template>
