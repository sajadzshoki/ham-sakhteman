<script setup lang="ts">
const { locale } = useI18n()
const dir = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'))
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-vazirmatn" :dir="dir">
    <slot />
  </div>
</template>
