<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
  back?: boolean
}>(), { subtitle: '', back: false })
</script>

<template>
  <div class="flex items-center gap-3 mb-6">
    <NuxtLink v-if="back" to="#" @click.prevent="$router.back()" class="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-soft transition-colors shrink-0">
      <Icon name="i-lucide-arrow-right" class="w-5 h-5" />
    </NuxtLink>
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-slate-400 mt-1 font-medium">{{ subtitle }}</p>
    </div>
  </div>
</template>
