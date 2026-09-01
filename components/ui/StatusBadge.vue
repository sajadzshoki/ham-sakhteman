<script setup lang="ts">
withDefaults(defineProps<{
  status: 'pending' | 'in-progress' | 'completed' | 'warning' | 'success'
  label?: string
}>(), { label: '' })

const map = {
  pending: { color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'در انتظار' },
  'in-progress': { color: 'bg-sky-50 text-sky-700 border-sky-100', label: 'در حال انجام' },
  completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'انجام شده' },
  warning: { color: 'bg-rose-50 text-rose-700 border-rose-100', label: 'هشدار' },
  success: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'موفق' },
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm" :class="map[status].color">
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
    {{ label || map[status].label }}
  </span>
</template>
