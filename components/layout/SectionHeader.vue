<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
}>(), { subtitle: '' })
</script>

<template>
  <div class="mb-4">
    <h3 class="text-base font-extrabold text-slate-800 tracking-tight leading-snug">{{ title }}</h3>
    <p v-if="subtitle" class="text-xs text-slate-400 mt-0.5 font-medium">{{ subtitle }}</p>
  </div>
</template>
