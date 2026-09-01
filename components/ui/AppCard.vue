<script setup lang="ts">
withDefaults(defineProps<{
  cardClass?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
  hover?: boolean
}>(), {
  cardClass: '', padding: 'md', hover: true,
})
</script>

<template>
  <div
    class="bg-white rounded-3xl border border-slate-100/80 shadow-soft transition-all duration-300"
    :class="[
      padding === 'sm' ? 'p-4' : padding === 'md' ? 'p-5' : padding === 'lg' ? 'p-7' : 'p-0',
      hover ? 'hover:shadow-soft-lg hover:-translate-y-0.5' : '',
      $attrs.class ?? cardClass,
    ]"
  >
    <slot />
  </div>
</template>
