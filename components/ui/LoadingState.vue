<script setup lang="ts">
withDefaults(defineProps<{
  text?: string
}>(), { text: 'در حال بارگذاری...' })
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 gap-3">
    <div class="w-10 h-10 rounded-full border-[3px] border-primary-100 border-t-primary-600 animate-spin" />
    <p v-if="text" class="text-sm text-slate-400 font-medium">{{ text }}</p>
  </div>
</template>
