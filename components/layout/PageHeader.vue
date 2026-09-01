<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  icon?: string
  action?: string
}>(), {
  title: '', subtitle: '', icon: '', action: '',
})
</script>

<template>
  <div class="flex items-end justify-between gap-4 mb-5">
    <div>
      <h2 v-if="title" class="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-slate-500 mt-1 font-medium">{{ subtitle }}</p>
    </div>
    <NuxtLink v-if="action" to="#" class="shrink-0 text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-xl transition-colors border border-primary-100/60">
      {{ action }}
      <Icon name="i-lucide-arrow-left" class="w-3.5 h-3.5" />
    </NuxtLink>
  </div>
</template>
