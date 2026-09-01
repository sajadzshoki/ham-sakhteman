<script setup lang="ts">
const props = withDefaults(defineProps<{
  name?: string
  initials?: string
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg'
}>(), { name: '', initials: '', avatarSize: 'md' })

const sizeClass = computed(() => {
  switch (props.avatarSize) {
    case 'xs': return 'w-7 h-7 text-[10px]'
    case 'sm': return 'w-8 h-8 text-xs'
    case 'lg': return 'w-14 h-14 text-xl'
    default: return 'w-10 h-10 text-sm'
  }
})
</script>

<template>
  <div :class="['rounded-full bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft font-extrabold shadow-inner-soft', sizeClass]" :title="name || initials">
    {{ initials || (name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2) : '?') }}
  </div>
</template>
