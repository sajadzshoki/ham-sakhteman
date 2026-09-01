<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue?: string; label?: string; placeholder?: string; type?: string; error?: string }>(), { modelValue: '', label: '', placeholder: '', type: 'text', error: '' })
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="w-full">
    <label v-if="props.label" class="block text-xs font-bold text-slate-600 mb-1.5">{{ props.label }}</label>
    <input
      :value="props.modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :type="props.type"
      :placeholder="props.placeholder"
      class="w-full h-12 px-4 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-soft"
    />
    <p v-if="props.error" class="text-xs text-rose-500 mt-1 font-medium">{{ props.error }}</p>
  </div>
</template>
