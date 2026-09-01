<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  message?: string
  icon?: string
}>(), {
  title: '', message: '', icon: 'i-lucide-inbox',
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-center">
    <div class="w-14 h-14 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4 border border-slate-100">
      <Icon :name="icon" class="w-7 h-7" />
    </div>
    <h4 v-if="title" class="text-base font-extrabold text-slate-800 mb-1">{{ title }}</h4>
    <p v-if="message" class="text-sm text-slate-400 font-medium max-w-xs">{{ message }}</p>
  </div>
</template>
