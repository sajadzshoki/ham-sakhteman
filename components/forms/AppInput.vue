<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  type?: string
  error?: string
  autocomplete?: string
}>(), {
  modelValue: '',
  label: '',
  placeholder: '',
  type: 'text',
  error: '',
  autocomplete: undefined,
})
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="w-full">
    <label v-if="props.label" class="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{{ props.label }}</label>
    <input
      :value="props.modelValue"
      :type="props.type"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      class="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-soft"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="props.error" class="text-xs text-rose-500 mt-1 font-medium">{{ props.error }}</p>
  </div>
</template>
